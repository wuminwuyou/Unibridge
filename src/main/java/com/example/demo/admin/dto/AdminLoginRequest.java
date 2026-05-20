package com.example.demo.admin.dto;

import lombok.Data;

@Data
public class AdminLoginRequest {
    private String adminId;
    private String passwordHash;
}
