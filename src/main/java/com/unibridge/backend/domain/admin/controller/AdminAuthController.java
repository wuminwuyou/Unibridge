package com.unibridge.backend.domain.admin.controller;

import com.unibridge.backend.domain.admin.dto.AdminLoginRequest;
import com.unibridge.backend.domain.admin.service.AdminAuthService;
import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.domain.legacy.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminAuthController {

    @Autowired
    private AdminAuthService adminAuthService;

    @PostMapping("/login")
    public Result adminLogin(@RequestBody AdminLoginRequest request) {
        LoginResponse response = adminAuthService.adminLogin(request);
        return Result.success(response);
    }
}
