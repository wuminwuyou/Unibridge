package com.unibridge.backend.infrastructure.entities.im;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("project_task_card")
public class ProjectTaskCard {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("milestone_id")
    private Long milestoneId;
    @TableField("assignee_uid")
    private String assigneeUid;
    private String title;
    private String content;
    private String status;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
