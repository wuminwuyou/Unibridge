package com.example.demo.media.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.BusinessException;
import com.example.demo.config.FileUploadProperties;
import com.example.demo.media.dto.FileMd5CheckResponse;
import com.example.demo.media.entity.FileRecord;
import com.example.demo.media.mapper.FileRecordMapper;
import com.example.demo.security.upload.FileUploadSecurityFacade;
import com.example.demo.security.upload.FileUploadSecurityFacade.SecureUploadArtifact;
import com.example.demo.security.upload.UploadMediaCategory;
import com.example.demo.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/** 多媒体上传业务（调用 {@link FileUploadSecurityFacade} 做安全检测后落盘）。 */
@Service
public class MediaUploadService {

    private static final Logger log = LoggerFactory.getLogger(MediaUploadService.class);
    private static final Pattern MD5_PATTERN = Pattern.compile("^[a-f0-9]{32}$");

    public static final String SUB_DIR_COVERS = "covers";
    public static final String SUB_DIR_VIDEOS = "videos";

    private final FileUploadProperties fileUploadProperties;
    private final FileRecordMapper fileRecordMapper;
    private final FileUploadSecurityFacade fileUploadSecurityFacade;

    public MediaUploadService(FileUploadProperties fileUploadProperties,
                              FileRecordMapper fileRecordMapper,
                              FileUploadSecurityFacade fileUploadSecurityFacade) {
        this.fileUploadProperties = fileUploadProperties;
        this.fileRecordMapper = fileRecordMapper;
        this.fileUploadSecurityFacade = fileUploadSecurityFacade;
    }

    public String uploadNoteCover(MultipartFile file, HttpServletRequest request) {
        return saveSecureUpload(file, UploadMediaCategory.NOTE_COVER, SUB_DIR_COVERS, request);
    }

    public String uploadNoteVideo(MultipartFile file, HttpServletRequest request) {
        return saveSecureUpload(file, UploadMediaCategory.NOTE_VIDEO, SUB_DIR_VIDEOS, request);
    }

    public FileMd5CheckResponse checkMd5(String md5) {
        String normalizedMd5 = normalizeAndValidateMd5(md5);
        FileRecord existing = findByMd5(normalizedMd5);
        if (existing != null) {
            log.info("MD5 pre-check hit (instant upload available): md5={}, url={}",
                    normalizedMd5, existing.getFilePath());
            return FileMd5CheckResponse.builder()
                    .exists(true)
                    .filePath(existing.getFilePath())
                    .build();
        }
        return FileMd5CheckResponse.builder()
                .exists(false)
                .filePath(null)
                .build();
    }

    private String saveSecureUpload(MultipartFile file,
                                    UploadMediaCategory category,
                                    String subDirectory,
                                    HttpServletRequest request) {
        try (SecureUploadArtifact artifact = fileUploadSecurityFacade.secureProcess(file, category)) {
            String clientIp = request != null ? IpUtil.resolveClientIp(request) : null;

            FileRecord existing = findByMd5(artifact.md5Hex());
            if (existing != null) {
                fileUploadSecurityFacade.auditSuccess(artifact, category, clientIp);
                log.info("Instant upload via MD5 dedup: md5={}, reusedUrl={}, skippedDiskWrite=true",
                        artifact.md5Hex(), existing.getFilePath());
                return existing.getFilePath();
            }

            Path targetDirectory = ensureDirectoryExists(subDirectory);
            String storedFileName = UUID.randomUUID() + "." + artifact.extension();
            Path targetPath = targetDirectory.resolve(storedFileName);

            Files.copy(artifact.stagedFile(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = buildPublicUrl(subDirectory, storedFileName);
            String finalUrl = persistFileRecordSafely(
                    artifact.md5Hex(), publicUrl, artifact.sizeBytes(), artifact.mimeType());

            fileUploadSecurityFacade.auditSuccess(artifact, category, clientIp);
            log.info("New file persisted: md5={}, path={}, size={}, url={}",
                    artifact.md5Hex(), targetPath, artifact.sizeBytes(), finalUrl);
            return finalUrl;
        } catch (IOException ex) {
            log.error("Failed to persist secure upload", ex);
            throw new BusinessException(500, "文件保存失败，请稍后重试");
        }
    }

    private String persistFileRecordSafely(String fileMd5, String publicUrl, long fileSize, String mimeType) {
        FileRecord record = new FileRecord();
        record.setFileMd5(fileMd5);
        record.setFilePath(publicUrl);
        record.setFileSize(fileSize);
        record.setMimeType(StringUtils.hasText(mimeType) ? mimeType : null);

        try {
            fileRecordMapper.insert(record);
            return publicUrl;
        } catch (DuplicateKeyException ex) {
            log.warn("DuplicateKey on file_md5={}, fallback to reuse existing record", fileMd5);
            FileRecord raceWinner = findByMd5(fileMd5);
            if (raceWinner == null) {
                throw new BusinessException(500, "文件索引冲突，请重试");
            }
            return raceWinner.getFilePath();
        }
    }

    private FileRecord findByMd5(String fileMd5) {
        LambdaQueryWrapper<FileRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FileRecord::getFileMd5, fileMd5).last("LIMIT 1");
        return fileRecordMapper.selectOne(wrapper);
    }

    private String normalizeAndValidateMd5(String md5) {
        if (!StringUtils.hasText(md5)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        String normalized = md5.trim().toLowerCase(Locale.ROOT);
        if (!MD5_PATTERN.matcher(normalized).matches()) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        return normalized;
    }

    private Path ensureDirectoryExists(String subDirectory) {
        Path directory = Paths.get(fileUploadProperties.getUploadFolder(), subDirectory);
        try {
            Files.createDirectories(directory);
        } catch (IOException ex) {
            throw new BusinessException(500, "上传目录初始化失败");
        }
        return directory;
    }

    private String buildPublicUrl(String subDirectory, String storedFileName) {
        String baseUrl = fileUploadProperties.getPublicBaseUrl().replaceAll("/+$", "");
        String accessPrefix = fileUploadProperties.publicUrlPrefix();
        if (!accessPrefix.startsWith("/")) {
            accessPrefix = "/" + accessPrefix;
        }
        return baseUrl + accessPrefix + "/" + subDirectory + "/" + storedFileName;
    }
}
