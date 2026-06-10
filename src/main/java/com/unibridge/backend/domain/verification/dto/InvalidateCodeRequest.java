package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvalidateCodeRequest {
    @Schema(description = "认证码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598-2026-00123")
    private String code;
}
