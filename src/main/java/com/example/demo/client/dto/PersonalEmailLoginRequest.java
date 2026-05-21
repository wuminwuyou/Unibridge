package com.example.demo.client.dto;

import lombok.Data;

/** 个人邮箱验证码登录请求参数。 */
@Data
public class PersonalEmailLoginRequest {
    private String account;
    private String emailCode;
    private Boolean rememberMe;
}
