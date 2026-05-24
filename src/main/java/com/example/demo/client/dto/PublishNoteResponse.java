package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 创建/更新笔记响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishNoteResponse {
    private Long noteId;
    private String contentTypeCode;
    private String publishAction;
    private String status;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
