package com.example.demo.client.dto;

import lombok.Data;

import java.util.List;

/** 创建/更新项目请求体（POST /projects、PUT /projects/{id}）。 */
@Data
public class PublishProjectRequest {
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
}
