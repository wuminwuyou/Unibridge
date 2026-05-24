package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /projects/{projectId} 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponse {
    private Long projectId;
    private String title;
    private String summary;
    private String channel;
    private String campusRecruitType;
    private String description;
    private String descriptionEditorType;
    private String amount;
    private String level;
    private String duration;
    private String teamSize;
    private List<String> skillTags;
    private String deadline;
    private String status;
    private String publishedAt;
    private String updatedAt;
}
