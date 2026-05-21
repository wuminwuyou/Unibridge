package com.example.demo.client.dto;

import lombok.Data;

/** 退出登录请求参数（双 token）。 */
@Data
public class HandleLogoutRequest {
    private String accessToken;
    private String refreshToken;
}
