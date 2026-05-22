package com.example.demo.admin.controller;

import com.example.demo.admin.dto.AdminLoginRequest;
import com.example.demo.admin.service.AdminAuthService;
import com.example.demo.common.Result;
import com.example.demo.dto.LoginResponse;
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
