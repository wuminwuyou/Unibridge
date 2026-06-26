package com.unibridge.backend.domain.feed.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Feed 流统一内容卡片 VO（笔记 / 项目混排）。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentVO {
    /** NOTE | PROJECT */
    private String contentType;
    /** 项目子类：COMMERCIAL | RECRUITMENT（仅 contentType=PROJECT 时有值） */
    private String projectCategory;
    /** 笔记子类：IMAGE_TEXT | VIDEO（仅 contentType=NOTE 时有值） */
    private String noteType;
    /** 对外公开 UID（笔记=content_type_code，项目=project_uid） */
    private String uid;
    private String title;
    /** 笔记摘要（NOTE） */
    private String summary;
    /** 项目卡片摘要（PROJECT，= project.preview） */
    private String preview;
    /** 笔记封面 / 项目封面（PROJECT 时 = 发布人所属主体 entity_profile.logo_url） */
    private String coverUrl;
    /** 项目：主体 Logo（= entity_profile.logo_url，与 coverUrl 同源） */
    private String logoSvgUrl;
    /** 项目：发布主体名称 */
    private String ownerOrganization;
    /** 项目：招募子类型 */
    private String recruitmentType;
    /** 项目：难度等级 */
    private String level;
    /** 项目：团队规模 */
    private String teamSize;
    /** 项目：预计周期 */
    private String duration;
    /** NOTE：string[] 标签，序列化为 "tags"。PROJECT 时此字段为空。 */
    @JsonProperty("tags")
    private List<String> noteTags;
    /** PROJECT：{ label }[] 标签 */
    @JsonIgnore
    private List<ContentTagLabel> projectTags;
    /** 笔记：发布者昵称 */
    private String authorNickName;
    /** 笔记：作者所属学校 / 组织 */
    private String authorOrganization;
    /** 笔记：作者头像 URL */
    private String authorAvatar;
    /** 笔记：视频时长（仅 VIDEO，格式 MM:SS） */
    private String videoDuration;
    private Integer views;
    /** 笔记：点赞数 */
    private Integer likes;
    /** 笔记：收藏数 */
    private Integer favorites;
    /** 笔记：评论数 */
    private Integer comments;
    private String publishTime;
    /** 推荐分（调试/排序透明，前端可忽略） */
    private Double score;
}
