package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 主体凭证登录（第一步）请求参数。 */
@Data
public class OrganizationCredentialLoginRequest {
    private String institutionCode;
    private String password;
}
