package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** TOTP 绑定确认响应。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationTotpSetupConfirmResponse {
    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
    private Boolean entityFullyActivated;
    private Integer boundAdminCount;
    private Integer minAdminCount;
    private String activationHint;
    /** 未达标时继续下一位管理员绑定/登记 */
    private String nextChallengeId;
    /** 常为 {@code admin_register} 或 {@code admin_select} */
    private String nextLoginMode;
}
