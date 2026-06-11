package com.unibridge.backend.domain.organization.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {

    @Schema(description = "机构主体代码", requiredMode = Schema.RequiredMode.REQUIRED, example = "10598")
    private String entityCode;

    @Schema(description = "用户 uid", requiredMode = Schema.RequiredMode.REQUIRED, example = "US00000000099")
    private String uid;

    @Schema(description = "角色：PM / MENTOR / COUNSELOR", example = "COUNSELOR")
    private String role;
}
