package com.unibridge.backend.domain.legacy.dto;

import lombok.Data;

@Data
public class UserLoginRequest {
    private String phone;
    private String passwordHash;
}
