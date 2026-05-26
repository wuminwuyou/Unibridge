package com.unibridge.backend.domain.admin.dto;

import lombok.Data;

@Data
public class EntityCreateRequest {
    private String name;
    private String type;
    private String intro;
}
