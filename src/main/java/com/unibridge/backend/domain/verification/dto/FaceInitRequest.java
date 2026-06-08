package com.unibridge.backend.domain.verification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceInitRequest {

    @Schema(description = "身份证真实姓名", requiredMode = Schema.RequiredMode.REQUIRED, example = "张三")
    private String realName;

    @Schema(description = "18 位身份证号", requiredMode = Schema.RequiredMode.REQUIRED, example = "440300199001011234")
    private String idCard;
}
