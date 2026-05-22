package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 主体档案实体，映射 `entity_profile` 表。 */
@Data
@TableName("entity_profile")
public class ClientEntityProfile {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("entity_id")
    private Long entityId;
    private String name;
    private String type;
    @TableField("logo_url")
    private String logoUrl;
    @TableField("banner_url")
    private String bannerUrl;
    private String intro;
    private String announcement;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
