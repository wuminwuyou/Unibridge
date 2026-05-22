package com.example.demo.client.controller;

import com.example.demo.client.dto.*;
import com.example.demo.client.service.ClientAuthService;
import com.example.demo.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Client 端认证控制器：
 * 提供个人注册/登录、验证码发送、主体两步登录接口。
 * 业务异常统一由 GlobalExceptionHandler 处理，HTTP 状态码与 Result.code 对齐。
 */
@RestController
@RequestMapping("/api/v1/client/auth")
public class ClientAuthController {

    @Autowired
    private ClientAuthService clientAuthService;

    @PostMapping("/personal/register")
    public Result registerPersonal(@RequestBody PersonalRegisterRequest request) {
        return Result.success(clientAuthService.registerPersonal(request));
    }

    @PostMapping("/personal/login/password")
    public Result personalLoginByPassword(@RequestBody PersonalPasswordLoginRequest request) {
        return Result.success(clientAuthService.loginPersonalByPassword(request));
    }

    @PostMapping("/personal/login/sms")
    public Result personalLoginBySms(@RequestBody PersonalSmsLoginRequest request) {
        return Result.success(clientAuthService.loginPersonalBySms(request));
    }

    @PostMapping("/personal/login/email")
    public Result personalLoginByEmail(@RequestBody PersonalEmailLoginRequest request) {
        return Result.success(clientAuthService.loginPersonalByEmail(request));
    }

    @PostMapping("/personal/sms/send")
    public Result sendPersonalCode(@RequestBody SendCodeRequest request) {
        return Result.success(clientAuthService.sendPersonalCode(request));
    }

    @PostMapping("/organization/login/credentials")
    public Result organizationLoginByCredentials(@RequestBody OrganizationCredentialLoginRequest request) {
        return Result.success(clientAuthService.loginOrganizationCredentials(request));
    }

    @PostMapping("/organization/login/otp")
    public Result organizationLoginByOtp(@RequestBody OrganizationOtpLoginRequest request) {
        return Result.success(clientAuthService.loginOrganizationOtp(request));
    }

    @PostMapping("/refresh")
    public Result refreshToken(@RequestBody RefreshTokenRequest request) {
        return Result.success(clientAuthService.refreshAccessToken(request));
    }

    @PostMapping("/logout")
    public Result handleLogout(@RequestBody HandleLogoutRequest request) {
        clientAuthService.handleLogout(request);
        return Result.success("logout success", null);
    }
}
