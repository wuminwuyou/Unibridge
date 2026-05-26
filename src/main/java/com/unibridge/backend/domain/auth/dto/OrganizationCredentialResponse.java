package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 主体凭证校验成功后返回的 challenge 数据。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationCredentialResponse {
    private String challengeId;
    private String passwordDigestPreview;
    private Integer otpExpireInSec;
    private String maskedTarget;
    private Boolean isFirstLogin;
    /** admin_select | admin_register | totp_setup | totp_verify */
    private String loginMode;
    /** 主体根密码登录且需选择管理员时为 true */
    private Boolean requiresAdminSelection;
    private List<OrganizationAdminOption> admins;
    private Integer boundAdminCount;
    private Integer minAdminCount;
    private Integer maxAdminCount;
    private Integer currentAdminOrder;
    private String entityName;
}
