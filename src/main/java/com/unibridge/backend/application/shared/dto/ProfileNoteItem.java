package com.unibridge.backend.application.shared.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
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
    /** 列表卡片层不再返回 */
    @JsonIgnore
    private Integer likes;
    @JsonIgnore
    private Integer comments;
    @JsonIgnore
    private Integer favorites;
    private String cover;
    /** 作者昵称（禁止返回实名） */
    @JsonProperty("authorNickname")
    @JsonAlias("authorNickName")
    private String authorNickname;
    /** 列表卡片层不再返回 */
    @JsonIgnore
    private String authorOrganization;
    /** 作者头像 URL */
    private String authorAvatar;
    /** 视频时长（仅视频笔记，格式 MM:SS） */
    private String videoDuration;
    /** 笔记状态：DRAFT | REVIEWING | PUBLISHED | BANNED（本人视角才返回） */
    private String status;
    /** 可见性：PUBLIC | PRIVATE（本人视角才返回） */
    private String visibility;
}
