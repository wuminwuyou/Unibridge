package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 统一团队/实验室实体，映射 `team` 表。 */
@Data
@TableName("team")
public class ClientTeam {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String type;
    @TableField("owner_id")
    private Long ownerId;
    @TableField("owner_name")
    private String ownerName;
    @TableField("entity_id")
    private Long entityId;
    @TableField("team_name")
    private String teamName;
    private String tag;
    private String intro;
    private String status;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
