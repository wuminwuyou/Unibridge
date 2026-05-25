package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 主体 OTP 校验（第二步）请求参数。 */
@Data
public class OrganizationOtpLoginRequest {
    private String challengeId;
    private String otpCode;
}
