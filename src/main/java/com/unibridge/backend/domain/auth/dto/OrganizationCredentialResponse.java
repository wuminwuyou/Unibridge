package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 主体凭证校验成功后返回的 challenge 数据。 */
@Data
@AllArgsConstructor
public class OrganizationCredentialResponse {
    private String challengeId;
    private String passwordDigestPreview;
    private Integer otpExpireInSec;
    private String maskedTarget;
}
