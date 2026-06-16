package com.unibridge.backend.infrastructure.media.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 文件资产记录，映射 {@code file_records} 表。 */
@Data
@TableName("file_record")
public class FileRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("file_md5")
    private String fileMd5;
    @TableField("file_path")
    private String filePath;
    @TableField("file_size")
    private Long fileSize;
    @TableField("mime_type")
    private String mimeType;
    @TableField("create_time")
    private LocalDateTime createTime;
}
