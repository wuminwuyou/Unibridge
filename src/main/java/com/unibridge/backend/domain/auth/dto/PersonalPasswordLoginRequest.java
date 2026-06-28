package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 个人密码登录请求参数。 */
@Data
public class PersonalPasswordLoginRequest {
    private String account;
    private String password;
    private Boolean rememberMe;
    private String channel;
    /** 登录后更新的头像 URL（可选，传非空字符串时写入 p_user_profile.avatar_url） */
    private String avatarUrl;
}
