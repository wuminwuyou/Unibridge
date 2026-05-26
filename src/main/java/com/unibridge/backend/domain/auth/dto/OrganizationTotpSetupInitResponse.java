package com.unibridge.backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** TOTP 绑定初始化响应。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationTotpSetupInitResponse {
    private String qrCodeDataUrl;
    private Integer qrCodeExpireInSec;
    private String otpAuthUrl;
    private Integer currentAdminOrder;
}
