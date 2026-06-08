package com.unibridge.backend.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileMenuResponse {
    private String userUid;
    private String nickname;
    private String level;
    private String avatarUrl;
    /** 主体名称（全部认证通过时）或空字符串；identity_only 时为 "" */
    private String verifiedOrganization;
    /** 认证状态："unverified"=未认证 | "identity_only"=仅身份验证（已实名但未机构认证） | "verified"=已全部认证 */
    private String verifyStatus;
}
