package com.unibridge.backend.infrastructure.security.upload;

import com.unibridge.backend.infrastructure.common.BusinessException;
import org.apache.commons.codec.digest.DigestUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 文件上传安全门面：统一编排校验 → 魔数检测 → 图片/视频/SVG 处理 → 临时文件清理钩子。
 * <p>
 * 后续新增上传接口只需调用 {@link #secureProcess(MultipartFile, UploadMediaCategory)}。
 * </p>
 */
@Component
public class FileUploadSecurityFacade {

    private static final Logger log = LoggerFactory.getLogger(FileUploadSecurityFacade.class);

    private final FileUploadSecurityValidator validator;
    private final SecureImageProcessor imageProcessor;
    private final SecureSvgProcessor svgProcessor;
    private final SecureVideoProcessor videoProcessor;
    private final UploadTempFileCleaner tempFileCleaner;
    private final UploadSecurityAuditLogger auditLogger;
    private final FileUploadSecurityProperties securityProperties;

    public FileUploadSecurityFacade(FileUploadSecurityValidator validator,
                                    SecureImageProcessor imageProcessor,
                                    SecureSvgProcessor svgProcessor,
                                    SecureVideoProcessor videoProcessor,
                                    UploadTempFileCleaner tempFileCleaner,
                                    UploadSecurityAuditLogger auditLogger,
                                    FileUploadSecurityProperties securityProperties) {
        this.validator = validator;
        this.imageProcessor = imageProcessor;
        this.svgProcessor = svgProcessor;
        this.videoProcessor = videoProcessor;
        this.tempFileCleaner = tempFileCleaner;
        this.auditLogger = auditLogger;
        this.securityProperties = securityProperties;
    }

    /**
     * 对上传文件执行完整安全管道，返回可落盘的临时安全文件（调用方负责在 finally 中 {@link SecureUploadArtifact#close()}）。
     */
    public SecureUploadArtifact secureProcess(MultipartFile file, UploadMediaCategory category) {
        FileUploadSecurityValidator.ValidatedUploadMetadata metadata =
                validator.validateMetadata(file, category);

        Path rawTemp = null;
        Path processedTemp = null;
        List<Path> disposable = new ArrayList<>();

        try {
            rawTemp = tempFileCleaner.createTempUpload("upload-raw-", "." + metadata.extension());
            disposable.add(rawTemp);
            file.transferTo(rawTemp);

            byte[] header;
            try (InputStream in = Files.newInputStream(rawTemp)) {
                header = in.readNBytes(512);
            }
            validator.validateMagicBytes(header, category, metadata.extension());

            processedTemp = postProcess(rawTemp, metadata.extension(), category, disposable);
            Path finalFile = processedTemp != null ? processedTemp : rawTemp;

            String md5 = computeMd5(finalFile);
            long size = Files.size(finalFile);
            boolean reencoded = processedTemp != null && !processedTemp.equals(rawTemp);

            return new SecureUploadArtifact(
                    finalFile,
                    metadata.extension(),
                    metadata.mimeType(),
                    size,
                    md5,
                    metadata.sanitizedFilename(),
                    disposable,
                    reencoded,
                    tempFileCleaner
            );
        } catch (BusinessException ex) {
            auditLogger.logRejected(category, ex.getMessage(), metadata.sanitizedFilename(), null);
            tempFileCleaner.deleteAllQuietly(disposable);
            throw ex;
        } catch (IOException ex) {
            auditLogger.logRejected(category, "IO_ERROR", metadata.sanitizedFilename(), null);
            tempFileCleaner.deleteAllQuietly(disposable);
            log.error("Upload security pipeline failed", ex);
            throw new BusinessException(500, "文件安全处理失败");
        }
    }

    public void auditSuccess(SecureUploadArtifact artifact,
                             UploadMediaCategory category,
                             String clientIp) {
        auditLogger.logSuccess(category, artifact.sanitizedOriginalFilename(), artifact.extension(),
                artifact.sizeBytes(), artifact.md5Hex(), clientIp, artifact.reencoded());
    }

    private Path postProcess(Path source,
                             String extension,
                             UploadMediaCategory category,
                             List<Path> disposable) throws IOException {
        return switch (category) {
            case NOTE_COVER -> processCover(source, extension, disposable);
            case NOTE_VIDEO -> processVideo(source, extension, disposable);
        };
    }

    private Path processCover(Path source, String extension, List<Path> disposable) throws IOException {
        if ("svg".equalsIgnoreCase(extension)) {
            if (!securityProperties.isSanitizeSvg()) {
                throw BusinessException.badRequest("不允许上传 SVG 文件");
            }
            Path sanitized = svgProcessor.sanitize(source);
            disposable.add(sanitized);
            return sanitized;
        }
        if (securityProperties.isStripImageMetadata()) {
            Path reencoded = imageProcessor.reencodeStripMetadata(source, extension);
            if (!reencoded.equals(source)) {
                disposable.add(reencoded);
                return reencoded;
            }
        }
        return source;
    }

    private Path processVideo(Path source, String extension, List<Path> disposable) throws IOException {
        Path reencoded = videoProcessor.reencodeIfEnabled(source, extension);
        if (!reencoded.equals(source)) {
            disposable.add(reencoded);
            return reencoded;
        }
        return source;
    }

    private String computeMd5(Path file) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            return DigestUtils.md5Hex(in).toLowerCase(Locale.ROOT);
        }
    }

    /**
     * 安全处理后的临时产物；{@link #close()} 会删除管道产生的所有中间文件。
     */
    public static final class SecureUploadArtifact implements AutoCloseable {
        private final Path stagedFile;
        private final String extension;
        private final String mimeType;
        private final long sizeBytes;
        private final String md5Hex;
        private final String sanitizedOriginalFilename;
        private final List<Path> disposablePaths;
        private final boolean reencoded;
        private final UploadTempFileCleaner tempFileCleaner;

        public SecureUploadArtifact(Path stagedFile,
                                    String extension,
                                    String mimeType,
                                    long sizeBytes,
                                    String md5Hex,
                                    String sanitizedOriginalFilename,
                                    List<Path> disposablePaths,
                                    boolean reencoded,
                                    UploadTempFileCleaner tempFileCleaner) {
            this.stagedFile = stagedFile;
            this.extension = extension;
            this.mimeType = mimeType;
            this.sizeBytes = sizeBytes;
            this.md5Hex = md5Hex;
            this.sanitizedOriginalFilename = sanitizedOriginalFilename;
            this.disposablePaths = disposablePaths;
            this.reencoded = reencoded;
            this.tempFileCleaner = tempFileCleaner;
        }

        public Path stagedFile() {
            return stagedFile;
        }

        public String extension() {
            return extension;
        }

        public String mimeType() {
            return mimeType;
        }

        public long sizeBytes() {
            return sizeBytes;
        }

        public String md5Hex() {
            return md5Hex;
        }

        public String sanitizedOriginalFilename() {
            return sanitizedOriginalFilename;
        }

        public boolean reencoded() {
            return reencoded;
        }

        @Override
        public void close() {
            tempFileCleaner.deleteAllQuietly(disposablePaths);
        }
    }
}
