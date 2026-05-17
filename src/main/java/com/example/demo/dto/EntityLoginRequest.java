package com.example.demo.dto;

import lombok.Data;

@Data
public class EntityLoginRequest {
    private String name;
    private String passwordHash;
}
