package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 通用登录响应数据。 */
@Data
@AllArgsConstructor
public class LoginResponse {
    private String userUid;
    private String userRole;
    private String authStatus;
    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
    /** 用户头像 URL（个人登录时从 p_user_profile.avatar_url 读取） */
    private String avatarUrl;
    /** 机构 Logo URL（机构登录时从 p_tenant_org_profile.logo_url 读取） */
    private String logoUrl;
}
