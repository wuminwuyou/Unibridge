package com.unibridge.backend.domain.admin.controller;

import com.unibridge.backend.domain.admin.dto.AdminLoginRequest;
import com.unibridge.backend.domain.admin.service.AdminAuthService;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin - 认证", description = "管理后台登录")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminAuthController {

    @Autowired
    private AdminAuthService adminAuthService;

    @Operation(summary = "管理员登录", description = "返回 admin JWT token")
    @PostMapping("/login")
    public Result adminLogin(@RequestBody AdminLoginRequest request) {
        return Result.success(adminAuthService.adminLogin(request));
    }
}
