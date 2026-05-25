package com.unibridge.backend.domain.legacy.dto;

import lombok.Data;

@Data
public class EntityLoginRequest {
    private String name;
    private String passwordHash;
}
