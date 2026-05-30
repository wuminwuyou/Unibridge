package com.unibridge.backend.domain.organization.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLabRequest {

    @Schema(description = "机构主体代码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598")
    private String entityCode;

    @Schema(description = "新实验室名称", example = "智能计算实验室（改名）")
    private String name;

    @Schema(description = "负责人 uid；null 表示清除负责人", example = "US00000000003")
    private String leaderUid;
}
