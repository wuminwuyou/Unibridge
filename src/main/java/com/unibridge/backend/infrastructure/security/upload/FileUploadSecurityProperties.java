package com.unibridge.backend.infrastructure.security.upload;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 文件上传安全策略配置，对应 {@code file.security.*}。
 */
@Data
@ConfigurationProperties(prefix = "file.security")
public class FileUploadSecurityProperties {

    /** 是否剥离图片 EXIF 等元数据（ImageIO 重编码） */
    private boolean stripImageMetadata = true;

    /** 是否对 SVG 做 Jsoup 清洗（若业务允许 svg 扩展名时生效；当前封面白名单不含 svg） */
    private boolean sanitizeSvg = true;

    /** 是否使用 ffmpeg 对视频重新编码（需服务器安装 ffmpeg） */
    private boolean videoReencodeEnabled = false;

    /** ffmpeg 可执行文件路径 */
    private String ffmpegPath = "ffmpeg";

    /** 视频重编码超时（秒） */
    private int ffmpegTimeoutSeconds = 600;

    /** 是否记录上传安全审计日志 */
    private boolean auditEnabled = true;

    /** 封面最大字节数（覆盖 enum 默认值时可配） */
    private Long coverMaxBytes;

    /** 视频最大字节数 */
    private Long videoMaxBytes;
}
