package com.unibridge.backend.domain.note.dto;

import com.unibridge.backend.infrastructure.security.xss.XssClean;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "创建/更新笔记请求体")
@Data
public class PublishNoteRequest {
    @Schema(description = "SAVE_DRAFT | PUBLISH")
    private String publishAction;
    @XssClean
    private String title;
    @XssClean
    private String summary;
    @Schema(description = "前端枚举：图文 | 视频")
    private String contentType;
    /** Markdown/HTML 正文；反序列化时自动 XSS 清洗 */
    @XssClean
    private String content;
    private List<String> tags;
    private String coverUrl;
    private String videoUrl;
    private Integer videoDuration;
}
