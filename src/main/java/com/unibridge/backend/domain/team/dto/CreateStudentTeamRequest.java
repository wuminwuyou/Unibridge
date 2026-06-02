package com.unibridge.backend.domain.team.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentTeamRequest {

    @Schema(description = "团队名称（≤32 字符）", requiredMode = Schema.RequiredMode.REQUIRED, example = "我的项目团队")
    private String name;

    @Schema(description = "团队简介（≤120 字符）", example = "聚焦前端工程化实践")
    private String description;

    @Schema(description = "初始成员 UID 列表（创建者自动成为 LEADER）")
    private List<String> initialMemberUids;
}
