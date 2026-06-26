package com.unibridge.backend.infrastructure.entities.project;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("t_project_counter")
public class ProjectCounter {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("project_uid")
    private String projectUid;
    @TableField("view_count")
    private Integer viewCount;
    /** 前端「感兴趣」按钮 */
    @TableField("collect_count")
    private Integer collectCount;
    /** TODO: 前端 IM 私聊功能尚未实现，chat_count 当前仅作快照预留 */
    @TableField("chat_count")
    private Integer chatCount;
}
