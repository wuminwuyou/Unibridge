package com.example.demo.dto;

import lombok.Data;

@Data
public class UserLoginRequest {
    private String phone;
    private String passwordHash;
}
