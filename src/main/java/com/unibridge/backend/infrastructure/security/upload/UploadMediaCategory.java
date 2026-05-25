package com.unibridge.backend.infrastructure.security.upload;

import java.util.Map;
import java.util.Set;

/**
 * 上传业务分类及其安全策略（MIME 白名单、扩展名白名单、大小上限）。
 */
public enum UploadMediaCategory {

    /** 笔记封面图 */
    NOTE_COVER(
            Set.of("jpg", "jpeg", "png", "gif", "webp"),
            Set.of("image/jpeg", "image/png", "image/gif", "image/webp"),
            Map.of(
                    "jpg", "image/jpeg",
                    "jpeg", "image/jpeg",
                    "png", "image/png",
                    "gif", "image/gif",
                    "webp", "image/webp"
            ),
            10L * 1024 * 1024
    ),

    /** 笔记视频 */
    NOTE_VIDEO(
            Set.of("mp4", "webm", "mov"),
            Set.of("video/mp4", "video/webm", "video/quicktime"),
            Map.of(
                    "mp4", "video/mp4",
                    "webm", "video/webm",
                    "mov", "video/quicktime"
            ),
            500L * 1024 * 1024
    );

    private final Set<String> allowedExtensions;
    private final Set<String> allowedMimeTypes;
    private final Map<String, String> extensionToMime;
    private final long defaultMaxBytes;

    UploadMediaCategory(Set<String> allowedExtensions,
                        Set<String> allowedMimeTypes,
                        Map<String, String> extensionToMime,
                        long defaultMaxBytes) {
        this.allowedExtensions = allowedExtensions;
        this.allowedMimeTypes = allowedMimeTypes;
        this.extensionToMime = extensionToMime;
        this.defaultMaxBytes = defaultMaxBytes;
    }

    public Set<String> allowedExtensions() {
        return allowedExtensions;
    }

    public Set<String> allowedMimeTypes() {
        return allowedMimeTypes;
    }

    public Map<String, String> extensionToMime() {
        return extensionToMime;
    }

    public long defaultMaxBytes() {
        return defaultMaxBytes;
    }
}
