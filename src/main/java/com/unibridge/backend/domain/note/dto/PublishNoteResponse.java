package com.unibridge.backend.domain.note.dto;

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
    /** 对外公开 UID（= content_type_code） */
    private String uid;
    private String publishAction;
    private String status;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
