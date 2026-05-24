package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 创建/更新项目响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishProjectResponse {
    private Long projectId;
    private String publishAction;
    private String status;
    private String category;
    private String recruitmentType;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
