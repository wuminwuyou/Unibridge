package com.unibridge.backend.domain.organization.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateLabRequest {

    @Schema(description = "机构主体代码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598")
    private String entityCode;

    @Schema(description = "实验室名称", requiredMode = Schema.RequiredMode.REQUIRED, example = "智能计算实验室")
    private String name;

    @Schema(description = "实验室负责人 uid", example = "US00000000002")
    private String leaderUid;
}
