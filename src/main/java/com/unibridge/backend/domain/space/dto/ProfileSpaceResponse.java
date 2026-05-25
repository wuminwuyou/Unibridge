package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 个人空间页壳（ProfileSpacePage）响应：
 * 一次性返回顶部 Hero、右侧 Sidebar、关联团队卡片所需数据，与 Tab 切换无关。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileSpaceResponse {

    /** 当前 Profile 主体唯一标识（user.id） */
    private Long id;

    /** Hero 栏核心基础信息 */
    private BaseInfo baseInfo;

    /** Sidebar 扩展/安全/统计信息 */
    private ExtendInfo extendInfo;

    /** 关联团队/实验室；无关联时为 null，前端不渲染团队卡片 */
    private AssociatedTeam associatedTeam;

    /** 个人荣誉列表；空数组时前端展示「暂无荣誉内容」 */
    private List<Object> honors;

    /** 活跃度热力图数值数组，每项 0~4 对应色阶 */
    private List<Integer> activityHeatmap;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BaseInfo {
        /** 昵称（Hero 标题） */
        private String nickname;
        /** 无头像图时的占位文字（昵称首字） */
        private String avatarText;
        /** 头像图片地址；有值时前端优先渲染 <img> */
        private String avatarUrl;
        /** 是否已实名/已认证 */
        private Boolean isVerified;
        /** 所属主体名称（学校或企业） */
        private String organization;
        /** 职位/身份：学生 / 教授 / HR 等 */
        private String position;
        /** 个人/机构一句话简介（对应 user_profile.intro） */
        private String bio;
        /** 能力/企业等级：N / R / SR / SSR / UR */
        private String level;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExtendInfo {
        /** 顶部公告文案（对应 user_profile.announcement） */
        private String notice;
        /** 实名状态详细文案：已实名 / 企业已认证 */
        private String verifyStatus;
        /** IP 属地展示文案，如「广东·深圳」 */
        private String ipLocation;
        /** 加入/注册时间，格式 yyyy.MM.dd */
        private String joinDate;
        /** 学历/职业背景（对应 user_profile.career_data） */
        private List<String> careerData;
        /** 技能标签（对应 user_profile.bio_data） */
        private List<String> skills;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssociatedTeam {
        /** 团队/实验室 ID */
        private Long id;
        /** 团队/实验室名称 */
        private String name;
        /** 一句话简介 */
        private String description;
        /** 点击跳转的路由路径，如 /lab/10001 */
        private String entryPath;
    }
}
