package com.example.demo.client.controller;

import com.example.demo.client.service.ClientProfileService;
import com.example.demo.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/user-profile")
public class ClientProfileController {

    @Autowired
    private ClientProfileService clientProfileService;

    @GetMapping("/menu")
    public Result getProfileMenu(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return Result.success(clientProfileService.getProfileMenu(authorization));
    }

    @GetMapping("/space")
    public Result getProfileSpace(@RequestHeader(value = "Authorization", required = false) String authorization,
                                  @RequestParam(value = "userId", required = false) Long userId,
                                  HttpServletRequest request) {
        return Result.success(clientProfileService.getProfileSpace(authorization, userId, request));
    }
}
