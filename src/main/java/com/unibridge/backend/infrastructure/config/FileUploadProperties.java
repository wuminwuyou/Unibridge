package com.unibridge.backend.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 本地多媒体落盘配置项，对应 {@code application.yml} 中 {@code file.*} 段。
 * <p>
 * 设计目标：在无 OSS 的开发阶段，用「物理磁盘 + 静态资源映射」模拟对象存储 URL 闭环。
 * </p>
 */
@Data
@ConfigurationProperties(prefix = "file")
public class FileUploadProperties {

    /** 本地物理绝对路径，例如 {@code D:/unibridge/uploads} */
    private String uploadFolder;

    /**
     * Spring MVC 静态资源 Handler 匹配模式，固定为 {@code /uploads/**}。
     * 浏览器访问 {@code /uploads/covers/xxx.jpg} 时会映射到 {@link #uploadFolder} 下同名相对路径。
     */
    private String accessPath = "/uploads/**";

    /**
     * 对外可访问的站点根 URL，例如 {@code http://localhost:8081}。
     * 用于拼装上传成功后的完整文件链接。
     */
    private String publicBaseUrl = "http://localhost:8081";

    /**
     * 将 {@link #accessPath} 转为 ResourceHandler 可用的 file: 协议前缀。
     * 例如 {@code file:D:/unibridge/uploads/}
     */
    public String toResourceLocation() {
        String normalized = uploadFolder.replace('\\', '/');
        if (!normalized.endsWith("/")) {
            normalized += "/";
        }
        return "file:" + normalized;
    }

    /**
     * 从 {@code /uploads/**} 提取公共 URL 前缀 {@code /uploads}。
     */
    public String publicUrlPrefix() {
        if (accessPath == null || accessPath.isBlank()) {
            return "/uploads";
        }
        return accessPath.replace("/**", "").replace("*", "");
    }
}
