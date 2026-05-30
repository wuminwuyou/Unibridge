package com.unibridge.backend.domain.organization.dto;

import com.unibridge.backend.application.shared.dto.ProfileNoteItem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间笔记 Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileNotesResponse {
    private String entityCode;
    private List<ProfileNoteItem> notes;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
