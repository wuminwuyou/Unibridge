package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文件资产记录，映射 {@code file_records} 表。
 * <p>
 * 以 {@code file_md5} 唯一索引作为去重防线，同一内容只落盘一次，后续请求秒传复用 {@code file_path}。
 * </p>
 */
@Data
@TableName("file_records")
public class FileRecord {
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 文件内容 MD5 十六进制指纹（32 位小写） */
    @TableField("file_md5")
    private String fileMd5;

    /** 对外可访问的静态资源 URL */
    @TableField("file_path")
    private String filePath;

    /** 文件大小（字节） */
    @TableField("file_size")
    private Long fileSize;

    /** MIME 类型，如 image/png */
    @TableField("mime_type")
    private String mimeType;

    @TableField("create_time")
    private LocalDateTime createTime;
}
