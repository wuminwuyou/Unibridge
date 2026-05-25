package com.example.demo.security.upload;

import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 文件名净化：移除路径穿越与特殊字符，防止目录穿越与日志注入。
 */
public final class FileNameSanitizer {

    private static final Pattern UNSAFE_CHARS = Pattern.compile("[^a-zA-Z0-9._\\-]");
    private static final int MAX_LENGTH = 200;

    private FileNameSanitizer() {
    }

    /**
     * @return 仅含安全字符的文件名（不含路径）；无法解析时返回 {@code upload.bin}
     */
    public static String sanitize(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "upload.bin";
        }
        String name = originalFilename.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.trim();
        if (!StringUtils.hasText(name) || ".".equals(name) || "..".equals(name)) {
            return "upload.bin";
        }
        name = UNSAFE_CHARS.matcher(name).replaceAll("_");
        if (name.length() > MAX_LENGTH) {
            int dot = name.lastIndexOf('.');
            if (dot > 0) {
                String ext = name.substring(dot);
                name = name.substring(0, MAX_LENGTH - ext.length()) + ext;
            } else {
                name = name.substring(0, MAX_LENGTH);
            }
        }
        return name.toLowerCase(Locale.ROOT);
    }

    public static String extractExtension(String sanitizedFilename) {
        if (!StringUtils.hasText(sanitizedFilename)) {
            return "";
        }
        int dot = sanitizedFilename.lastIndexOf('.');
        if (dot < 0 || dot == sanitizedFilename.length() - 1) {
            return "";
        }
        return sanitizedFilename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
