package com.unibridge.backend.domain.project.dto;

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
    /** 对外公开 UID（= project_uid） */
    private String uid;
    private String publishAction;
    private String status;
    private String category;
    private String recruitmentType;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
