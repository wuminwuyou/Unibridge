package com.unibridge.backend.infrastructure.security.upload;

import com.unibridge.backend.infrastructure.common.BusinessException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Map;

/**
 * 上传前置校验（1–4）：MIME 白名单、扩展名、大小、文件名净化、魔数与声明类型一致性。
 */
@Component
public class FileUploadSecurityValidator {

    private final FileUploadSecurityProperties securityProperties;

    public FileUploadSecurityValidator(FileUploadSecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    /**
     * 校验 multipart 元数据；返回净化后的文件名与解析出的扩展名。
     */
    public ValidatedUploadMetadata validateMetadata(MultipartFile file, UploadMediaCategory category) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("上传文件不能为空");
        }

        long maxBytes = resolveMaxBytes(category);
        if (file.getSize() > maxBytes) {
            throw BusinessException.badRequest("文件大小超出限制");
        }

        String sanitizedName = FileNameSanitizer.sanitize(file.getOriginalFilename());
        String extension = resolveAllowedExtension(file, sanitizedName, category);
        String declaredMime = normalizeMime(file.getContentType());

        if (StringUtils.hasText(declaredMime) && !category.allowedMimeTypes().contains(declaredMime)) {
            throw BusinessException.badRequest("不支持的文件 MIME 类型");
        }

        String expectedMime = category.extensionToMime().get(extension);
        if (StringUtils.hasText(declaredMime)
                && StringUtils.hasText(expectedMime)
                && !declaredMime.equals(expectedMime)) {
            throw BusinessException.badRequest("文件扩展名与 MIME 类型不匹配");
        }

        return new ValidatedUploadMetadata(sanitizedName, extension,
                StringUtils.hasText(declaredMime) ? declaredMime : expectedMime, maxBytes);
    }

    /**
     * 魔数与业务分类交叉校验；SVG 在非允许列表中直接拒绝。
     */
    public void validateMagicBytes(byte[] header, UploadMediaCategory category, String resolvedExtension) {
        FileMagicBytesDetector.DetectedFormat detected = FileMagicBytesDetector.detect(header);
        if (detected == FileMagicBytesDetector.DetectedFormat.UNKNOWN) {
            throw BusinessException.badRequest("无法识别的文件内容，拒绝上传");
        }
        if (detected == FileMagicBytesDetector.DetectedFormat.SVG) {
            throw BusinessException.badRequest("不允许上传 SVG 文件");
        }
        if (!FileMagicBytesDetector.matchesCategory(detected, category)) {
            throw BusinessException.badRequest("文件内容与声明类型不符");
        }
        String magicExt = FileMagicBytesDetector.toExtension(detected);
        if (!magicExt.equals(resolvedExtension)
                && !(magicExt.equals("jpg") && "jpeg".equals(resolvedExtension))) {
            throw BusinessException.badRequest("文件魔数与扩展名不一致");
        }
    }

    private long resolveMaxBytes(UploadMediaCategory category) {
        return switch (category) {
            case NOTE_COVER -> securityProperties.getCoverMaxBytes() != null
                    ? securityProperties.getCoverMaxBytes()
                    : category.defaultMaxBytes();
            case NOTE_VIDEO -> securityProperties.getVideoMaxBytes() != null
                    ? securityProperties.getVideoMaxBytes()
                    : category.defaultMaxBytes();
        };
    }

    private String resolveAllowedExtension(MultipartFile file,
                                           String sanitizedName,
                                           UploadMediaCategory category) {
        String extension = FileNameSanitizer.extractExtension(sanitizedName);
        if (!StringUtils.hasText(extension)) {
            extension = extensionFromMime(normalizeMime(file.getContentType()), category.extensionToMime());
        }
        extension = extension == null ? "" : extension.toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(extension) || !category.allowedExtensions().contains(extension)) {
            throw BusinessException.badRequest("不支持的文件类型，请上传合法的多媒体文件");
        }
        return "jpeg".equals(extension) ? "jpg" : extension;
    }

    private String extensionFromMime(String mime, Map<String, String> extensionToMime) {
        if (!StringUtils.hasText(mime)) {
            return "";
        }
        for (Map.Entry<String, String> entry : extensionToMime.entrySet()) {
            if (mime.equals(entry.getValue())) {
                return entry.getKey();
            }
        }
        return "";
    }

    private String normalizeMime(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "";
        }
        int semicolon = contentType.indexOf(';');
        return (semicolon > 0 ? contentType.substring(0, semicolon) : contentType)
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    public record ValidatedUploadMetadata(
            String sanitizedFilename,
            String extension,
            String mimeType,
            long maxBytes
    ) {
    }
}
