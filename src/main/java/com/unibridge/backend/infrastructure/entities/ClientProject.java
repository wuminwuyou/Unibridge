package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 统一项目实体，映射 `project` 表。 */
@Data
@TableName("project")
public class ClientProject {
    @TableId(type = IdType.AUTO)
    private Long id;
    /** 对外公开 UID（PR+11 位）；API 仅暴露此字段 */
    @TableField("project_uid")
    private String projectUid;
    /** 代发归属：entity_code（企业/学校）或 team_uid（实验室/学生团队） */
    @TableField("extended_uid")
    private String extendedUid;
    private String category;
    private String recruitmentType;
    @TableField("owner_uid")
    private String ownerUid;
    @TableField("team_uid")
    private String teamUid;
    private String title;
    private String preview;
    /** 编辑器类型：MARKDOWN | RICHTEXT（暂保留，当前默认 MARKDOWN） */
    @TableField("editor_type")
    private String editorType;
    /** 项目详情正文（Markdown） */
    private String description;
    private String tags;
    private String duration;
    @TableField("team_size")
    private String teamSize;
    private LocalDate deadline;
    private String level;
    private String status;
    @TableField("published_at")
    private LocalDateTime publishedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
