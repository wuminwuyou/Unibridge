package com.unibridge.backend.infrastructure.entities.note;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user_note_counter")
public class NoteCounter {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("content_type_code")
    private String contentTypeCode;
    @TableField("view_count")
    private Integer viewCount;
    @TableField("like_count")
    private Integer likeCount;
    @TableField("collect_count")
    private Integer collectCount;
    @TableField("comment_count")
    private Integer commentCount;
}
