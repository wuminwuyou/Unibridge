package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 刷新 accessToken 请求参数。 */
@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
