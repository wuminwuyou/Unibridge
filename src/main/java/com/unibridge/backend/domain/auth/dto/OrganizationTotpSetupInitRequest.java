package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** TOTP 绑定初始化请求。 */
@Data
public class OrganizationTotpSetupInitRequest {
    private String challengeId;
}
