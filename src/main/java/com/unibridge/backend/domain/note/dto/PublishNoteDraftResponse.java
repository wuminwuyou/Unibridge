package com.unibridge.backend.domain.note.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /notes/{uid}/draft 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishNoteDraftResponse {
    private String uid;
    private String publishAction;
    private String title;
    private String summary;
    private String contentType;
    private String content;
    private List<String> tags;
    private String coverUrl;
    private String videoUrl;
    private Integer videoDuration;
    private String editorType;
}
