package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 主体根密码登录后待选管理员项。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationAdminOption {
    private String adminUid;
    private String displayName;
    private Boolean isPrimary;
}
