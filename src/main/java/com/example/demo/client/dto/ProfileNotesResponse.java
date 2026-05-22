package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间「笔记」Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileNotesResponse {
    private Long userId;
    private List<ProfileNoteItem> notes;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
