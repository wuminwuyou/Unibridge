package com.example.demo.security.upload;

import com.example.demo.common.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * 视频重新编码（ffmpeg，等价 Node ffmpeg 流程）；默认关闭，生产可按需开启。
 */
@Component
public class SecureVideoProcessor {

    private static final Logger log = LoggerFactory.getLogger(SecureVideoProcessor.class);

    private final FileUploadSecurityProperties securityProperties;

    public SecureVideoProcessor(FileUploadSecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public Path reencodeIfEnabled(Path source, String extension) throws IOException {
        if (!securityProperties.isVideoReencodeEnabled()) {
            return source;
        }
        Path target = Files.createTempFile("secure-video-", ".mp4");
        List<String> command = new ArrayList<>();
        command.add(securityProperties.getFfmpegPath());
        command.add("-y");
        command.add("-i");
        command.add(source.toAbsolutePath().toString());
        command.add("-c:v");
        command.add("libx264");
        command.add("-c:a");
        command.add("aac");
        command.add("-movflags");
        command.add("+faststart");
        command.add(target.toAbsolutePath().toString());

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);
        Process process = builder.start();
        boolean finished;
        try {
            finished = process.waitFor(securityProperties.getFfmpegTimeoutSeconds(), TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            Files.deleteIfExists(target);
            throw BusinessException.badRequest("视频处理被中断");
        }
        if (!finished) {
            process.destroyForcibly();
            Files.deleteIfExists(target);
            throw BusinessException.badRequest("视频处理超时");
        }
        if (process.exitValue() != 0) {
            Files.deleteIfExists(target);
            log.warn("ffmpeg re-encode failed, exit={}, ext={}", process.exitValue(), extension);
            throw BusinessException.badRequest("视频安全处理失败");
        }
        log.info("Video re-encoded via ffmpeg: sourceExt={}, output=mp4", extension);
        return target;
    }
}
