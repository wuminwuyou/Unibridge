package com.unibridge.backend.infrastructure.entities.profile;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("p_tenant_org_profile")
public class TenantOrgProfile {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("entity_code")
    private String entityCode;
    private String name;
    private String location;
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
