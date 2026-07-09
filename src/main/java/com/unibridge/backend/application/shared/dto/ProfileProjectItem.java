package com.unibridge.backend.application.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 个人空间项目卡片项（对齐 ProjectCard / ProjectItem）。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileProjectItem {
    /** 对外公开 UID，用于跳转详情/编辑页 */
    private String uid;
    private String title;
    /** 卡片摘要（= project.preview） */
    private String preview;
    /**
     * 项目卡片封面；当前取自发布人所属主体 {@code entity_profile.logo_url}。
     * {@code null} 时前端回退 {@code logoSvgUrl} / 文字占位。
     */
    private String coverUrl;
    private List<TagLabel> tags;
    /** COMMERCIAL | RECRUITMENT */
    private String category;
    private String recruitmentType;
    /** 发布主体名称 */
    private String ownerOrganization;
    /** 主体 Logo（= entity_profile.logo_url） */
    private String logoSvgUrl;
    private String publishTime;
    private String level;
    private String duration;
    /** 发布人名称（卡片展示，取自 user_profile.nickName 或脱敏实名） */
    private String publisherName;
    /** 发布人头像 URL（取自 user_profile.avatarUrl） */
    private String publisherAvatar;
    /** 预算区间最小值（纯数字字符串，如 "5000"） */
    private String amountMin;
    /** 预算区间最大值（纯数字字符串，如 "20000"） */
    private String amountMax;
    /** DRAFT | OPEN | ONGOING | CLOSED */
    private String status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagLabel {
        private String label;
    }
}
