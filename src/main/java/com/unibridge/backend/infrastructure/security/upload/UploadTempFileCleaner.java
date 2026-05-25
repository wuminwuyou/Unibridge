package com.unibridge.backend.infrastructure.security.upload;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * 临时文件生命周期管理：上传后清理中间产物，防止磁盘堆积与敏感残留。
 */
@Component
public class UploadTempFileCleaner {

    private static final Logger log = LoggerFactory.getLogger(UploadTempFileCleaner.class);

    public Path createTempUpload(String prefix, String suffix) throws IOException {
        return Files.createTempFile(prefix, suffix);
    }

    public void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            if (Files.deleteIfExists(path)) {
                log.debug("Temp upload file deleted: {}", path);
            }
        } catch (IOException ex) {
            log.warn("Failed to delete temp upload file: {}", path, ex);
        }
    }

    public void deleteAllQuietly(Path... paths) {
        if (paths == null) {
            return;
        }
        for (Path path : paths) {
            deleteQuietly(path);
        }
    }

    public void deleteAllQuietly(List<Path> paths) {
        if (paths == null) {
            return;
        }
        deleteAllQuietly(paths.toArray(Path[]::new));
    }

    /** 注册 JVM 退出钩子作为兜底（非正常中断时尽力清理） */
    public void registerDeleteOnExit(Path path) {
        if (path != null) {
            path.toFile().deleteOnExit();
        }
    }
}
