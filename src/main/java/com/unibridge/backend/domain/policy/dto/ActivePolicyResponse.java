package com.unibridge.backend.domain.policy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.unibridge.backend.infrastructure.entities.SysPolicyConfig;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@Schema(description = "活跃协议查询响应")
public class ActivePolicyResponse {

    @Schema(description = "协议类型", example = "REAL_NAME")
    @JsonProperty("policyType")
    private String policyType;

    @Schema(description = "协议版本号", example = "v1.0.0")
    @JsonProperty("versionCode")
    private String versionCode;

    @Schema(description = "协议全文 SHA-256 哈希", example = "a1b2c3d4...")
    @JsonProperty("contentHash")
    private String contentHash;

    @Schema(description = "协议全文（Markdown 格式）")
    @JsonProperty("policyContent")
    private String policyContent;

    @Schema(description = "协议生效时间", example = "2026-06-11T10:00:00")
    @JsonProperty("effectiveAt")
    private LocalDateTime effectiveAt;

    public static ActivePolicyResponse fromEntity(SysPolicyConfig entity) {
        return ActivePolicyResponse.builder()
                .policyType(entity.getPolicyType())
                .versionCode(entity.getVersionCode())
                .contentHash(entity.getContentHash())
                .policyContent(entity.getPolicyContent())
                .effectiveAt(entity.getCreatedAt())
                .build();
    }
}

