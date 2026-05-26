package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间主页 Tab 响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileHomeResponse {
    private String entityCode;
    private List<EntityTeamPreviewItem> teams;
    private List<ProfileProjectItem> projects;
    private List<ProfileNoteItem> notes;
    private Long teamTotal;
    private Long projectTotal;
    private Long noteTotal;
}
