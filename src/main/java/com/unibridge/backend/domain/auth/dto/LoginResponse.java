package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 通用登录响应数据。 */
@Data
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String userRole;
    private String authStatus;
    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
}
