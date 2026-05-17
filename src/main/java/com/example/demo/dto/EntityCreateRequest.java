package com.example.demo.dto;

import lombok.Data;

@Data
public class EntityCreateRequest {
    private String name;
    private String type;
    private String intro;
}
