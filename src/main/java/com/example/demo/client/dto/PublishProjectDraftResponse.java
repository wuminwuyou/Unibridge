package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /projects/{projectId}/draft 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishProjectDraftResponse {
    private Long projectId;
    private String publishAction;
    private String title;
    private String summary;
    private String channel;
    private String campusRecruitType;
    private String description;
    private String amount;
    private String level;
    private String duration;
    private String teamSize;
    private List<String> skillTags;
    private String deadline;
    private String descriptionEditorType;
}
