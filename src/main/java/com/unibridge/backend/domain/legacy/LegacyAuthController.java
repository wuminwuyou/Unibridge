package com.unibridge.backend.domain.legacy;

import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.domain.legacy.dto.EntityLoginRequest;
import com.unibridge.backend.domain.legacy.dto.LoginResponse;
import com.unibridge.backend.domain.legacy.dto.UserLoginRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 旧版演示登录接口（/api/v1/user/login 等），与 client 端 auth 域隔离。
 */
@RestController
@RequestMapping("/api/v1")
public class LegacyAuthController {

    @Autowired
    private LegacyAuthService legacyAuthService;

    @PostMapping("/user/login")
    public Result userLogin(@RequestBody UserLoginRequest request) {
        LoginResponse response = legacyAuthService.userLogin(request);
        return Result.success(response);
    }

    @PostMapping("/entity/login")
    public Result entityLogin(@RequestBody EntityLoginRequest request) {
        LoginResponse response = legacyAuthService.entityLogin(request);
        return Result.success(response);
    }

    @PostMapping("/logout")
    public Result logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        String token = authorization.replace("Bearer ", "");
        legacyAuthService.logout(token);
        return Result.success("退出登录成功", null);
    }
}
