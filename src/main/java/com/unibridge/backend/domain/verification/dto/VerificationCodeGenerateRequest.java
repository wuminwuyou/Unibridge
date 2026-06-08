package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationCodeGenerateRequest {

    @Schema(description = "母码或子码的最大使用次数（母码默认1000，子码默认50）", example = "500")
    private Integer maxQuota;

    @Schema(description = "毕业年份（四位，可选，仅子码可填写）", example = "2026")
    private Integer graduationYear;

    @Schema(description = "认证码描述（如'用于计算机专业学生的认证'）", example = "用于计算机专业学生的认证")
    private String description;

    @Schema(description = "母码 code（仅生成子码时需要）")
    private String masterCode;
}
