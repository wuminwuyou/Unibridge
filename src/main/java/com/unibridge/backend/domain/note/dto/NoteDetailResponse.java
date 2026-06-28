package com.unibridge.backend.domain.note.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /notes/{uid} 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteDetailResponse {
    /** 对外公开 UID（= content_type_code） */
    private String uid;
    private String contentType;
    private String title;
    private String summary;
    private String body;
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
    /** 可见性：PUBLIC | PRIVATE */
    private String visibility;
    /** 父笔记简要信息（便捷子笔记时非空，顶级笔记为 null） */
    private ParentNote parentNote;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Author {
        private String uid;
        private String name;
        private String organization;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentNote {
        private String uid;
        private String title;
        private String summary;
        private String contentType;
        private List<String> tags;
        private String cover;
        private Integer views;
        private Integer comments;
        private Integer favorites;
    }
}
