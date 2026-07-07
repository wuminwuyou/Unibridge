package com.unibridge.backend.infrastructure.entities.project;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("project_uid")
    private String projectUid;
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
    @TableField("editor_type")
    private String editorType;
    /** 项目预算/赏金区间（如 "10000 - 20000" 或 "面议"） */
    private String budget;
    private String tags;
    private String duration;
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
