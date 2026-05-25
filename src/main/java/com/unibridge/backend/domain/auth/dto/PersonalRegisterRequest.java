package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 个人注册请求参数。 */
@Data
public class PersonalRegisterRequest {
    private String account;
    private String password;
    private String confirmPassword;
    private String verifyCode;
    private String channel;
}
