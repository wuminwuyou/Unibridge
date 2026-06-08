package com.unibridge.backend.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCodeGenerateResponse {
    /** 生成的唯一认证码 */
    private String code;
    private String entityCode;
    /** 毕业年份（子码可填写，母码取服务器当前年） */
    private Integer graduationYear;
    /** 最大使用次数 */
    private Integer maxQuota;
    /** 认证码过期时间（yyyy-MM-dd HH:mm:ss） */
    private String expireTime;
}
