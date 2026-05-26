package com.unibridge.backend.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "个人注册请求")
@Data
public class PersonalRegisterRequest {
    @Schema(description = "手机号或邮箱", example = "13800001001")
    private String account;
    @Schema(description = "密码 SHA256 哈希", example = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92")
    private String password;
    private String confirmPassword;
    private String verifyCode;
    @Schema(description = "SMS | EMAIL")
    private String channel;
}
