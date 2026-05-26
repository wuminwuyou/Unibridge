package com.unibridge.backend.domain.auth;

import com.unibridge.backend.domain.auth.dto.HandleLogoutRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationAdminRegisterRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationCredentialLoginRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationOtpLoginRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationSelectAdminRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupConfirmRequest;
import com.unibridge.backend.domain.auth.dto.OrganizationTotpSetupInitRequest;
import com.unibridge.backend.domain.auth.dto.PersonalEmailLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalPasswordLoginRequest;
import com.unibridge.backend.domain.auth.dto.PersonalRegisterRequest;
import com.unibridge.backend.domain.auth.dto.PersonalSmsLoginRequest;
import com.unibridge.backend.domain.auth.dto.RefreshTokenRequest;
import com.unibridge.backend.domain.auth.dto.SendCodeRequest;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Client 端认证控制器：
 * 提供个人注册/登录、验证码发送、主体两步登录接口。
 * 业务异常统一由 GlobalExceptionHandler 处理，HTTP 状态码与 Result.code 对齐。
 */
@Tag(name = "Client - 认证", description = "个人/机构注册登录、验证码、Token 刷新与登出")
@RestController
@RequestMapping("/api/v1/client/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Operation(summary = "个人用户注册", description = "注册成功后返回 access_token / refresh_token")
    @PostMapping("/personal/register")
    public Result registerPersonal(@RequestBody PersonalRegisterRequest request) {
        return Result.success(authService.registerPersonal(request));
    }

    @Operation(summary = "个人密码登录", description = "password 传 SHA256 哈希值，非明文")
    @PostMapping("/personal/login/password")
    public Result personalLoginByPassword(@RequestBody PersonalPasswordLoginRequest request) {
        return Result.success(authService.loginPersonalByPassword(request));
    }

    @Operation(summary = "个人短信验证码登录")
    @PostMapping("/personal/login/sms")
    public Result personalLoginBySms(@RequestBody PersonalSmsLoginRequest request) {
        return Result.success(authService.loginPersonalBySms(request));
    }

    @Operation(summary = "个人邮箱验证码登录")
    @PostMapping("/personal/login/email")
    public Result personalLoginByEmail(@RequestBody PersonalEmailLoginRequest request) {
        return Result.success(authService.loginPersonalByEmail(request));
    }

    @Operation(summary = "发送个人验证码", description = "支持短信 / 邮箱场景")
    @PostMapping("/personal/sms/send")
    public Result sendPersonalCode(@RequestBody SendCodeRequest request) {
        return Result.success(authService.sendPersonalCode(request));
    }

    @Operation(summary = "机构凭证登录（第一步）", description = "支持主体根密码或管理员密码；根密码且已有管理员时返回 admin_select")
    @PostMapping("/organization/login/credentials")
    public Result organizationLoginByCredentials(@RequestBody OrganizationCredentialLoginRequest request) {
        return Result.success(authService.loginOrganizationCredentials(request));
    }

    @Operation(summary = "登记主体管理员", description = "loginMode=admin_register 时调用；成功后 loginMode=totp_setup")
    @PostMapping("/organization/admin/register")
    public Result registerOrganizationAdmin(@RequestBody OrganizationAdminRegisterRequest request) {
        return Result.success(authService.registerOrganizationAdmin(request));
    }

    @Operation(summary = "主体根密码登录后选择管理员", description = "loginMode=admin_select 时调用")
    @PostMapping("/organization/login/select-admin")
    public Result selectOrganizationAdmin(@RequestBody OrganizationSelectAdminRequest request) {
        return Result.success(authService.selectOrganizationAdmin(request));
    }

    @Operation(summary = "机构 OTP 登录（第二步）", description = "已绑定 TOTP 的管理员或主体根账号校验验证码")
    @PostMapping("/organization/login/otp")
    public Result organizationLoginByOtp(@RequestBody OrganizationOtpLoginRequest request) {
        return Result.success(authService.loginOrganizationOtp(request));
    }

    @Operation(summary = "机构 TOTP 首次绑定初始化", description = "返回 QR 码与 otpauth URL")
    @PostMapping("/organization/totp/setup/init")
    public Result initOrganizationTotpSetup(@RequestBody OrganizationTotpSetupInitRequest request) {
        return Result.success(authService.initOrganizationTotpSetup(request));
    }

    @Operation(summary = "机构 TOTP 首次绑定确认", description = "校验 TOTP 并签发 token")
    @PostMapping("/organization/totp/setup/confirm")
    public Result confirmOrganizationTotpSetup(@RequestBody OrganizationTotpSetupConfirmRequest request) {
        return Result.success(authService.confirmOrganizationTotpSetup(request));
    }

    @Operation(summary = "刷新 access_token")
    @PostMapping("/refresh")
    public Result refreshToken(@RequestBody RefreshTokenRequest request) {
        return Result.success(authService.refreshAccessToken(request));
    }

    @Operation(summary = "登出", description = "使 refresh_token 失效")
    @PostMapping("/logout")
    public Result handleLogout(@RequestBody HandleLogoutRequest request) {
        authService.handleLogout(request);
        return Result.success("logout success", null);
    }
}
