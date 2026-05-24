package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间笔记卡片项。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileNoteItem {
    /** 笔记 ID，用于跳转详情/编辑页 */
    private Long id;
    private String title;
    private String summary;
    /** 图文 / 视频 */
    private String contentType;
    private List<String> tags;
    private String publishTime;
    private String updateTime;
    private Integer views;
    private Integer comments;
    private Integer favorites;
    private String cover;
}
