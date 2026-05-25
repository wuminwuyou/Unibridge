package com.example.demo.client.dto;

import com.example.demo.security.xss.XssClean;
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
