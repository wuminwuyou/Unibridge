package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 主体根密码登录后选择管理员。 */
@Data
public class OrganizationSelectAdminRequest {
    private String challengeId;
    private String adminUid;
}
