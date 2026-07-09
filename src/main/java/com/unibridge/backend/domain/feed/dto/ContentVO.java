package com.unibridge.backend.domain.feed.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
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
    /** 项目：预计周期 */
    private String duration;
    /** 项目：发布人名称（卡片展示，取自 user_profile.nickName 或脱敏实名） */
    private String publisherName;
    /** 项目：发布人头像 URL（取自 user_profile.avatarUrl） */
    private String publisherAvatar;
    /** 项目：预算区间最小值（纯数字字符串，如 "5000"；null 时不展示预算行） */
    private String amountMin;
    /** 项目：预算区间最大值（纯数字字符串，如 "20000"；null 时不展示预算行） */
    private String amountMax;
    /** NOTE：string[] 标签 */
    @JsonIgnore
    private List<String> noteTags;
    /** PROJECT：{ label }[] 标签 */
    @JsonIgnore
    private List<ContentTagLabel> projectTags;

    @JsonGetter("tags")
    public List<?> getTagsForResponse() {
        if ("NOTE".equals(contentType)) {
            return noteTags;
        }
        if ("PROJECT".equals(contentType)) {
            return projectTags;
        }
        return null;
    }
    /** 笔记：发布者昵称（卡片展示；禁止返回实名） */
    @JsonProperty("authorNickname")
    @JsonAlias("authorNickName")
    private String authorNickname;
    /** 笔记：作者头像 URL */
    private String authorAvatar;
    /** 笔记：视频时长（仅 VIDEO，格式 MM:SS） */
    private String videoDuration;
    private Integer views;
    /** 笔记：点赞数（列表卡片层不再返回，排序算法内部仍可使用） */
    @JsonIgnore
    private Integer likes;
    /** 笔记：收藏数（列表卡片层不再返回） */
    @JsonIgnore
    private Integer favorites;
    /** 笔记：评论数（列表卡片层不再返回） */
    @JsonIgnore
    private Integer comments;
    private String publishTime;
    /** 笔记：最近更新时间；与 publishTime 相同时前端走相对时效 */
    private String updateTime;
    /** 推荐分（调试/排序透明，前端可忽略） */
    private Double score;
}
