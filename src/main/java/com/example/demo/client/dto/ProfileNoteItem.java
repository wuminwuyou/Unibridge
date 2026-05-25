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
    /** 对外公开 UID，用于跳转详情/编辑页 */
    private String uid;
    private String title;
    private String summary;
    /** 图文 / 视频 */
    private String contentType;
    private List<String> tags;
    private String publishTime;
    private String updateTime;
    private Integer views;
    /** 点赞数（网格页脚 ThumbsUp） */
    private Integer likes;
    private Integer comments;
    private Integer favorites;
    private String cover;
    /** 作者昵称 */
    private String authorNickName;
    /** 作者所属学校 / 组织 */
    private String authorOrganization;
    /** 作者头像 URL */
    private String authorAvatar;
    /** 视频时长（仅视频笔记，格式 MM:SS） */
    private String videoDuration;
}
