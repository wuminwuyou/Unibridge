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
    /** 预算区间最小值（纯数字字符串，如 "80000"） */
    private String amountMin;
    /** 预算区间最大值（纯数字字符串，如 "120000"） */
    private String amountMax;
    /** 商业项目详情描述密文（非对称加密，仅 category=COMMERCIAL 时有值） */
    private String contentDetail;
    private String level;
    private String duration;
    private List<String> skillTags;
    private String deadline;
}
