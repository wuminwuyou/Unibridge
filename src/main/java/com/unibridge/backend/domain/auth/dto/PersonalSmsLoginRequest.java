package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 个人短信验证码登录请求参数。 */
@Data
public class PersonalSmsLoginRequest {
    private String account;
    private String smsCode;
    private Boolean rememberMe;
}
