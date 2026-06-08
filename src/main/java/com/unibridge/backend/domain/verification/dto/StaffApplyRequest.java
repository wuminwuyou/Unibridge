package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffApplyRequest {

    @Schema(description = "机构主体代码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598")
    private String entityCode;

    @Schema(description = "阶段一核身通过的实名", requiredMode = Schema.RequiredMode.REQUIRED, example = "张三")
    private String realName;

    @Schema(description = "工号/员工编号", requiredMode = Schema.RequiredMode.REQUIRED, example = "SZU2024001")
    private String staffNumber;
}
