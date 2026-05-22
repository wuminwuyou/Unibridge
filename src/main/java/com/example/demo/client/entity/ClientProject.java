package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

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
    private String tags;
    private String level;
    private String status;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("published_at")
    private LocalDateTime publishedAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
