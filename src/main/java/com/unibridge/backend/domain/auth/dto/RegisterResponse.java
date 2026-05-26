package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 个人注册响应数据。 */
@Data
@AllArgsConstructor
public class RegisterResponse {
    private String userUid;
    private String userRole;
    private String authStatus;
    private Boolean needVerificationGuide;
    private String accessToken;
    private String refreshToken;
}
