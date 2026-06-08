package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentActivateRequest {

    @Schema(description = "认证码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598-2026-00123-0456")
    private String verificationCode;

    @Schema(description = "学号", requiredMode = Schema.RequiredMode.REQUIRED, example = "2024001234")
    private String studentId;

    @Schema(description = "真实姓名（前端自动拼接，阶段一核身通过后已记录）", requiredMode = Schema.RequiredMode.REQUIRED, example = "张三")
    private String realName;

    @Schema(description = "毕业年份（四位，必填）", requiredMode = Schema.RequiredMode.REQUIRED, example = "2026")
    private Integer graduationYear;
}
