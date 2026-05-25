package com.unibridge.backend.domain.auth.dto;

import lombok.Data;

/** 验证码下发请求参数。 */
@Data
public class SendCodeRequest {
    private String account;
    private String bizType;
    private String channel;
    private String captchaToken;
}
