package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /notes/{noteId} 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteDetailResponse {
    private Long noteId;
    private String contentType;
    private String contentTypeCode;
    private String title;
    private String summary;
    private String body;
    private String editorType;
    private List<String> tags;
    private String coverUrl;
    private String videoUrl;
    private Integer videoDuration;
    private Author author;
    private String publishTime;
    private String updateTime;
    private Integer views;
    private Integer comments;
    private Integer favorites;
    private String status;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Author {
        private String name;
        private String handle;
        private String avatarUrl;
    }
}
