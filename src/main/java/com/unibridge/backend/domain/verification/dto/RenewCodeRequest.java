package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RenewCodeRequest {
    @Schema(description = "认证码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598-2026-00123")
    private String code;

    @Schema(description = "延期至日期（yyyy-MM-dd）", requiredMode = Schema.RequiredMode.REQUIRED, example = "2026-07-06")
    private String newExpireDate;
}
