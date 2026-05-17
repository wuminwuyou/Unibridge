package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/admin/login")
    public Result adminLogin(@RequestBody AdminLoginRequest request) {
        try {
            LoginResponse response = authService.adminLogin(request);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error(401, e.getMessage());
        }
    }

    @PostMapping("/user/login")
    public Result userLogin(@RequestBody UserLoginRequest request) {
        try {
            LoginResponse response = authService.userLogin(request);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error(401, e.getMessage());
        }
    }

    @PostMapping("/entity/login")
    public Result entityLogin(@RequestBody EntityLoginRequest request) {
        try {
            LoginResponse response = authService.entityLogin(request);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error(401, e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result logout(@RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            authService.logout(token);
            return Result.success("退出登录成功", null);
        } catch (Exception e) {
            return Result.error(500, e.getMessage());
        }
    }
}
