package com.unibridge.backend.infrastructure.entities.project;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("project_body")
public class ProjectBody {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("project_uid")
    private String projectUid;
    private String description;
}
