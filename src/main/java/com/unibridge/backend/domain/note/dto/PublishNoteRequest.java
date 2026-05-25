package com.unibridge.backend.domain.note.dto;

import com.unibridge.backend.infrastructure.security.xss.XssClean;
import lombok.Data;

import java.util.List;

/** 创建/更新笔记请求体（POST /notes、PUT /notes/{id}）。 */
@Data
public class PublishNoteRequest {
    private String publishAction;
    @XssClean
    private String title;
    @XssClean
    private String summary;
    /** 前端枚举：图文 | 视频 */
    private String contentType;
    /** Markdown/HTML 正文；反序列化时自动 XSS 清洗 */
    @XssClean
    private String content;
    private List<String> tags;
    private String coverUrl;
    private String videoUrl;
    private Integer videoDuration;
}
