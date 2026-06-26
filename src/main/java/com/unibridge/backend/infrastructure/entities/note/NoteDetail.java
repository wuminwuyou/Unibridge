package com.unibridge.backend.infrastructure.entities.note;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user_note_detail")
public class NoteDetail {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("content_type_code")
    private String contentTypeCode;
    @TableField("parent_content_type_code")
    private String parentContentTypeCode;
    private String content;
}
