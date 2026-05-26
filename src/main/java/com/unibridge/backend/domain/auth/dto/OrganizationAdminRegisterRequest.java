package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 主体根密码 challenge 下登记新管理员。 */
@Data
public class OrganizationAdminRegisterRequest {
    private String challengeId;
    private String displayName;
    /** SHA256 十六进制小写 */
    private String password;
}
