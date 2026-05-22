package com.example.demo.controller;

import com.example.demo.common.BusinessException;
import com.example.demo.common.Result;
import com.example.demo.dto.EntityLoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.UserLoginRequest;
import com.example.demo.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/user/login")
    public Result userLogin(@RequestBody UserLoginRequest request) {
        LoginResponse response = authService.userLogin(request);
        return Result.success(response);
    }

    @PostMapping("/entity/login")
    public Result entityLogin(@RequestBody EntityLoginRequest request) {
        LoginResponse response = authService.entityLogin(request);
        return Result.success(response);
    }

    @PostMapping("/logout")
    public Result logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        String token = authorization.replace("Bearer ", "");
        authService.logout(token);
        return Result.success("退出登录成功", null);
    }
}
