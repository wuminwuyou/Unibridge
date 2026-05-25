package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间「主页」Tab 响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileHomeResponse {
    private Long userId;
    private List<ProfileProjectItem> projects;
    private List<ProfileNoteItem> notes;
    private Long projectTotal;
    private Long noteTotal;
}
