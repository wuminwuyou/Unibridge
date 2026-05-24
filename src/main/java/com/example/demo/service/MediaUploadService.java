package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.BusinessException;
import com.example.demo.config.FileUploadProperties;
import com.example.demo.dto.FileMd5CheckResponse;
import com.example.demo.entity.FileRecord;
import com.example.demo.mapper.FileRecordMapper;
import org.apache.commons.codec.digest.DigestUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 本地多媒体上传业务层（MD5 去重秒传版）。
 * <p>
 * 双重防线去重流：
 * <ol>
 *   <li>基因提取：落盘前计算 MD5</li>
 *   <li>第一道防线：查 {@code file_records}，命中则秒传复用 URL，禁止重复写盘</li>
 *   <li>第二道防线：新文件才 {@code transferTo} 落盘并入库；高并发唯一索引冲突时妥协复用</li>
 * </ol>
 * </p>
 */
@Service
public class MediaUploadService {

    private static final Logger log = LoggerFactory.getLogger(MediaUploadService.class);
    private static final Pattern MD5_PATTERN = Pattern.compile("^[a-f0-9]{32}$");

    /** 封面图落盘子目录 */
    public static final String SUB_DIR_COVERS = "covers";
    /** 视频落盘子目录 */
    public static final String SUB_DIR_VIDEOS = "videos";

    private static final Set<String> COVER_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "webm", "mov");

    private static final Map<String, String> CONTENT_TYPE_EXTENSION = Map.ofEntries(
            Map.entry("image/jpeg", "jpg"),
            Map.entry("image/png", "png"),
            Map.entry("image/gif", "gif"),
            Map.entry("image/webp", "webp"),
            Map.entry("video/mp4", "mp4"),
            Map.entry("video/webm", "webm"),
            Map.entry("video/quicktime", "mov")
    );

    private final FileUploadProperties fileUploadProperties;
    private final FileRecordMapper fileRecordMapper;

    public MediaUploadService(FileUploadProperties fileUploadProperties, FileRecordMapper fileRecordMapper) {
        this.fileUploadProperties = fileUploadProperties;
        this.fileRecordMapper = fileRecordMapper;
    }

    /**
     * 上传笔记封面，落盘至 {@code {upload-folder}/covers/}（含 MD5 秒传）。
     */
    public String uploadNoteCover(MultipartFile file) {
        return saveMultipartFileWithDedup(file, SUB_DIR_COVERS, COVER_EXTENSIONS);
    }

    /**
     * 上传笔记视频，落盘至 {@code {upload-folder}/videos/}（含 MD5 秒传）。
     */
    public String uploadNoteVideo(MultipartFile file) {
        return saveMultipartFileWithDedup(file, SUB_DIR_VIDEOS, VIDEO_EXTENSIONS);
    }

    /**
     * 秒传预检：前端在大文件正式上传前，仅发送 MD5 判断是否已存在。
     *
     * @param md5 32 位小写十六进制 MD5
     */
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

    /**
     * 双重防线去重上传管道。
     */
    private String saveMultipartFileWithDedup(MultipartFile file,
                                              String subDirectory,
                                              Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("上传文件不能为空");
        }

        String extension = resolveExtension(file, allowedExtensions);
        String mimeType = normalizeContentType(file.getContentType());
        long fileSize = file.getSize();

        // ── Step 1：基因提取（落盘前优先计算 MD5） ──
        String fileMd5 = computeMd5Hex(file);

        // ── Step 2：第一道防线 —— 数据库秒传拦截 ──
        FileRecord existing = findByMd5(fileMd5);
        if (existing != null) {
            log.info("Instant upload via MD5 dedup: md5={}, reusedUrl={}, skippedDiskWrite=true",
                    fileMd5, existing.getFilePath());
            return existing.getFilePath();
        }

        // ── Step 3：第二道防线 —— 新文件才允许物理写盘 ──
        Path targetDirectory = ensureDirectoryExists(subDirectory);
        String storedFileName = UUID.randomUUID() + "." + extension;
        Path targetPath = targetDirectory.resolve(storedFileName);

        try {
            file.transferTo(targetPath);
        } catch (IOException ex) {
            log.error("Failed to save uploaded file to {}", targetPath, ex);
            throw new BusinessException(500, "文件保存失败，请稍后重试");
        }

        String publicUrl = buildPublicUrl(subDirectory, storedFileName);
        String finalUrl = persistFileRecordSafely(fileMd5, publicUrl, fileSize, mimeType);

        log.info("New file persisted: md5={}, path={}, size={}, url={}",
                fileMd5, targetPath, fileSize, finalUrl);
        return finalUrl;
    }

    /**
     * 写入 {@code file_records}；若高并发下唯一索引冲突，则妥协复用先入库记录的 URL。
     *
     * @return 最终应对前端返回的 URL（可能与当前落盘路径不同，以 DB 为准）
     */
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
            // 高并发：另一线程刚刚写入同一 MD5，转为妥协复用逻辑
            log.warn("DuplicateKey on file_md5={}, fallback to reuse existing record", fileMd5);
            FileRecord raceWinner = findByMd5(fileMd5);
            if (raceWinner == null) {
                log.error("DuplicateKey but record not found for md5={}", fileMd5, ex);
                throw new BusinessException(500, "文件索引冲突，请重试");
            }
            // 当前线程落盘的物理文件可能成为孤儿；生产环境可异步清理
            return raceWinner.getFilePath();
        }
    }

    /**
     * 通过数据流计算文件 MD5 十六进制字符串（小写）。
     * <p>
     * 必须在 {@code transferTo} 之前调用；Spring 对磁盘暂存的 Multipart 通常允许多次打开流。
     * </p>
     */
    private String computeMd5Hex(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            return DigestUtils.md5Hex(inputStream).toLowerCase(Locale.ROOT);
        } catch (IOException ex) {
            log.error("Failed to compute MD5 for upload file", ex);
            throw new BusinessException(500, "文件指纹计算失败");
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
            log.error("Failed to create upload subdirectory: {}", directory, ex);
            throw new BusinessException(500, "上传目录初始化失败");
        }
        return directory;
    }

    private String resolveExtension(MultipartFile file, Set<String> allowedExtensions) {
        String extension = extractExtensionFromFilename(file.getOriginalFilename());
        if (!StringUtils.hasText(extension)) {
            extension = CONTENT_TYPE_EXTENSION.getOrDefault(
                    normalizeContentType(file.getContentType()), "");
        }
        extension = extension == null ? "" : extension.toLowerCase(Locale.ROOT);

        if (!StringUtils.hasText(extension) || !allowedExtensions.contains(extension)) {
            throw BusinessException.badRequest("不支持的文件类型，请上传合法的多媒体文件");
        }
        return extension;
    }

    private String extractExtensionFromFilename(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "";
        }
        String filename = originalFilename.replace('\\', '/');
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1);
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "";
        }
        int semicolon = contentType.indexOf(';');
        return semicolon > 0 ? contentType.substring(0, semicolon).trim().toLowerCase(Locale.ROOT)
                : contentType.trim().toLowerCase(Locale.ROOT);
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
