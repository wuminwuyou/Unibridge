package com.example.demo.security.upload;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * 基于文件头魔数检测真实类型，防止伪造 Content-Type / 扩展名。
 */
public final class FileMagicBytesDetector {

    public enum DetectedFormat {
        JPEG, PNG, GIF, WEBP, SVG, MP4, WEBM, QUICKTIME, UNKNOWN
    }

    private FileMagicBytesDetector() {
    }

    public static DetectedFormat detect(byte[] header) {
        if (header == null || header.length < 12) {
            return DetectedFormat.UNKNOWN;
        }
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
            return DetectedFormat.JPEG;
        }
        if (header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
            return DetectedFormat.PNG;
        }
        if (startsWith(header, "GIF87a".getBytes()) || startsWith(header, "GIF89a".getBytes())) {
            return DetectedFormat.GIF;
        }
        if (startsWith(header, "RIFF".getBytes()) && containsAt(header, "WEBP".getBytes(), 8)) {
            return DetectedFormat.WEBP;
        }
        if (looksLikeSvg(header)) {
            return DetectedFormat.SVG;
        }
        if (containsAt(header, "ftyp".getBytes(), 4)) {
            return DetectedFormat.MP4;
        }
        if (startsWith(header, new byte[]{0x1A, 0x45, (byte) 0xDF, (byte) 0xA3})) {
            return DetectedFormat.WEBM;
        }
        if (containsAt(header, "moov".getBytes(), 4) || containsAt(header, "mdat".getBytes(), 4)) {
            return DetectedFormat.QUICKTIME;
        }
        return DetectedFormat.UNKNOWN;
    }

    public static DetectedFormat detect(InputStream inputStream) throws IOException {
        byte[] header = inputStream.readNBytes(512);
        return detect(header);
    }

    public static String toExtension(DetectedFormat format) {
        return switch (format) {
            case JPEG -> "jpg";
            case PNG -> "png";
            case GIF -> "gif";
            case WEBP -> "webp";
            case SVG -> "svg";
            case MP4 -> "mp4";
            case WEBM -> "webm";
            case QUICKTIME -> "mov";
            case UNKNOWN -> "";
        };
    }

    public static String toMimeType(DetectedFormat format) {
        return switch (format) {
            case JPEG -> "image/jpeg";
            case PNG -> "image/png";
            case GIF -> "image/gif";
            case WEBP -> "image/webp";
            case SVG -> "image/svg+xml";
            case MP4 -> "video/mp4";
            case WEBM -> "video/webm";
            case QUICKTIME -> "video/quicktime";
            case UNKNOWN -> "";
        };
    }

    public static boolean matchesCategory(DetectedFormat detected, UploadMediaCategory category) {
        String ext = toExtension(detected);
        if (ext.isEmpty()) {
            return false;
        }
        return category.allowedExtensions().contains(ext);
    }

    private static boolean looksLikeSvg(byte[] header) {
        String prefix = new String(header, 0, Math.min(header.length, 256))
                .trim()
                .toLowerCase(Locale.ROOT);
        return prefix.startsWith("<svg") || prefix.startsWith("<?xml");
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean containsAt(byte[] data, byte[] needle, int offset) {
        if (data.length < offset + needle.length) {
            return false;
        }
        for (int i = 0; i < needle.length; i++) {
            if (data[offset + i] != needle[i]) {
                return false;
            }
        }
        return true;
    }
}
