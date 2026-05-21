package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 验证码下发响应数据。 */
@Data
@AllArgsConstructor
public class SendCodeResponse {
    private String requestId;
    private Integer expireInSec;
    private Integer retryAfterSec;
}
