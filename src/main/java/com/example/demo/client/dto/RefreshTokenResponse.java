package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 刷新 accessToken 响应数据。 */
@Data
@AllArgsConstructor
public class RefreshTokenResponse {
    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
}
