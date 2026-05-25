package com.unibridge.backend.domain.admin.dto;

import lombok.Data;

@Data
public class AdminLoginRequest {
    private String adminId;
    private String passwordHash;
}
