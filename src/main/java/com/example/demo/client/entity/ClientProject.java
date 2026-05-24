package com.example.demo.client.entity;

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
    private String category;
    private String recruitmentType;
    @TableField("owner_id")
    private Long ownerId;
    @TableField("team_id")
    private Long teamId;
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
