package com.unibridge.backend.domain.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "项目难度评估请求体")
public class ProjectEvaluateRequest {
    @Schema(description = "密钥标识（来自 GET /public-key 响应），后端据此定位正确的解密私钥")
    private String keyId;
    @Schema(description = "需求详情原文（公开项，不加密），Markdown 格式")
    private String description;
    @Schema(description = "项目内容详细描述，经 RSA-OAEP SHA-256 加密后的 base64 密文")
    private String encryptedContentDetail;
}
