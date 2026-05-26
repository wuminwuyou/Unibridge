package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** TOTP 绑定确认请求。 */
@Data
public class OrganizationTotpSetupConfirmRequest {
    private String challengeId;
    private String totpCode;
}
