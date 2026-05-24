package com.example.demo.client.dto;

import lombok.Data;

import java.util.List;

/** 创建/更新笔记请求体（POST /notes、PUT /notes/{id}）。 */
@Data
public class PublishNoteRequest {
    private String publishAction;
    private String title;
    private String summary;
    /** 前端枚举：图文 | 视频 */
    private String contentType;
    private String content;
    private List<String> tags;
    private String coverUrl;
    private String videoUrl;
    private Integer videoDuration;
}
