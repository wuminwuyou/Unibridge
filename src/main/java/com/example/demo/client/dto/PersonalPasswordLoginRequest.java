package com.example.demo.client.dto;

import lombok.Data;

/** 个人密码登录请求参数。 */
@Data
public class PersonalPasswordLoginRequest {
    private String account;
    private String password;
    private Boolean rememberMe;
    private String channel;
}
