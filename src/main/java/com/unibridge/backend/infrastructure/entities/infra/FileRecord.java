package com.unibridge.backend.infrastructure.entities.infra;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("file_record")
public class FileRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String fileMd5;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private LocalDateTime createTime;
}
