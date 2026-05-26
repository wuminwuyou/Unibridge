package com.unibridge.backend.domain.project.dto;

import com.unibridge.backend.infrastructure.security.xss.XssClean;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "创建/更新项目请求体")
@Data
public class PublishProjectRequest {
    @Schema(description = "SAVE_DRAFT | PUBLISH")
    private String publishAction;
    @XssClean
    private String title;
    @XssClean
    private String summary;
    private String channel;
    private String campusRecruitType;
    /** Markdown/HTML 详情；反序列化时自动 XSS 清洗 */
    @XssClean
    private String description;
    private String amount;
    private String level;
    private String duration;
    private String teamSize;
    private List<String> skillTags;
    private String deadline;
}
