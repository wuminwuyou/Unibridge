package com.unibridge.backend.infrastructure.entities.interaction;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("project_achievement")
public class Achievement {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("achievement_uid")
    private String achievementUid;
    @TableField("user_uid")
    private String userUid;
    @TableField("source_project_uid")
    private String sourceProjectUid;
    @TableField("masked_project_name")
    private String maskedProjectName;
    @TableField("task_description")
    private String taskDescription;
    @TableField("technical_tags")
    private String technicalTags;
    @TableField("completed_at")
    private LocalDateTime completedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
