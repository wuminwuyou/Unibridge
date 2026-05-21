package com.example.demo.client.controller;

import com.example.demo.client.dto.*;
import com.example.demo.client.service.ClientAuthService;
import com.example.demo.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Client 端认证控制器：
 * 提供个人注册/登录、验证码发送、主体两步登录接口。
 */
@RestController
@RequestMapping("/api/v1/client/auth")
public class ClientAuthController {

    @Autowired
    private ClientAuthService clientAuthService;

    @PostMapping("/personal/register")
    public Result registerPersonal(@RequestBody PersonalRegisterRequest request) {
        try {
            return Result.success(clientAuthService.registerPersonal(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/personal/login/password")
    public Result personalLoginByPassword(@RequestBody PersonalPasswordLoginRequest request) {
        try {
            return Result.success(clientAuthService.loginPersonalByPassword(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/personal/login/sms")
    public Result personalLoginBySms(@RequestBody PersonalSmsLoginRequest request) {
        try {
            return Result.success(clientAuthService.loginPersonalBySms(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/personal/login/email")
    public Result personalLoginByEmail(@RequestBody PersonalEmailLoginRequest request) {
        try {
            return Result.success(clientAuthService.loginPersonalByEmail(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/personal/sms/send")
    public Result sendPersonalCode(@RequestBody SendCodeRequest request) {
        try {
            return Result.success(clientAuthService.sendPersonalCode(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/organization/login/credentials")
    public Result organizationLoginByCredentials(@RequestBody OrganizationCredentialLoginRequest request) {
        try {
            return Result.success(clientAuthService.loginOrganizationCredentials(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/organization/login/otp")
    public Result organizationLoginByOtp(@RequestBody OrganizationOtpLoginRequest request) {
        try {
            return Result.success(clientAuthService.loginOrganizationOtp(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public Result refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            return Result.success(clientAuthService.refreshAccessToken(request));
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }
}
