package com.unibridge.backend.domain.team.dto;

import com.unibridge.backend.application.shared.dto.ProfileNoteItem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间「笔记」Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProfileNotesResponse {
    private String teamUid;
    private List<ProfileNoteItem> notes;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
