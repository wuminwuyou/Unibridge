package com.unibridge.backend.infrastructure.config;

import com.unibridge.backend.infrastructure.security.upload.FileUploadSecurityProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 本地多媒体静态资源映射配置。
 * <p>
 * 当浏览器或前端访问 {@code http://localhost:8081/uploads/covers/xxx.jpg} 时，
 * Spring MVC 会从 {@code file.upload-folder} 指向的物理目录读取文件并以文件流返回。
 * </p>
 */
@Configuration
@EnableConfigurationProperties({FileUploadProperties.class, FileUploadSecurityProperties.class})
public class UploadConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(UploadConfig.class);
    private static final String REQUIRED_ACCESS_PATH = "/uploads/**";

    private final FileUploadProperties fileUploadProperties;

    public UploadConfig(FileUploadProperties fileUploadProperties) {
        this.fileUploadProperties = fileUploadProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        validateConfiguration();

        String handlerPattern = fileUploadProperties.getAccessPath();
        String resourceLocation = fileUploadProperties.toResourceLocation();

        registry.addResourceHandler(handlerPattern)
                .addResourceLocations(resourceLocation);

        log.info("Local upload static mapping enabled: [{}] -> [{}]",
                handlerPattern, resourceLocation);
    }

    /**
     * 启动期校验：防止误配 access-path 导致静态资源 404 或路径穿越风险。
     */
    private void validateConfiguration() {
        if (!StringUtils.hasText(fileUploadProperties.getUploadFolder())) {
            throw new IllegalStateException("file.upload-folder must not be empty");
        }
        if (!REQUIRED_ACCESS_PATH.equals(fileUploadProperties.getAccessPath())) {
            throw new IllegalStateException(
                    "file.access-path must be locked to " + REQUIRED_ACCESS_PATH
                            + ", current=" + fileUploadProperties.getAccessPath());
        }

        Path root = Paths.get(fileUploadProperties.getUploadFolder());
        try {
            Files.createDirectories(root);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to create upload root directory: " + root, ex);
        }
    }
}
