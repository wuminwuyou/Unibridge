package com.unibridge.backend.domain.note.dto;

import com.unibridge.backend.infrastructure.security.xss.XssClean;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "创建/更新笔记请求体")
@Data
public class PublishNoteRequest {
    @Schema(description = "SAVE_DRAFT | PUBLISH", requiredMode = Schema.RequiredMode.REQUIRED)
    private String publishAction;
    @Schema(description = "笔记标题", requiredMode = Schema.RequiredMode.REQUIRED)
    @XssClean
    private String title;
    @Schema(description = "一句话摘要", requiredMode = Schema.RequiredMode.REQUIRED)
    @XssClean
    private String summary;
    @Schema(description = "前端枚举：图文 | 视频", requiredMode = Schema.RequiredMode.REQUIRED)
    private String contentType;
    /** Markdown/HTML 正文；反序列化时自动 XSS 清洗 */
    @Schema(description = "正文内容（图文笔记必填）", requiredMode = Schema.RequiredMode.REQUIRED)
    @XssClean
    private String content;
    @Schema(description = "技能/主题标签（至少 1 个）", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> tags;
    @Schema(description = "封面图片 URL", requiredMode = Schema.RequiredMode.REQUIRED)
    private String coverUrl;
    @Schema(description = "视频地址（视频笔记必填）")
    private String videoUrl;
    private Integer videoDuration;
    /** 父视频笔记 contentTypeCode（便捷笔记场景，图文子笔记关联父视频笔记） */
    private String parentContentTypeCode;
    @Schema(description = "可见性：PUBLIC | PRIVATE", defaultValue = "PUBLIC")
    private String visibility;
}
