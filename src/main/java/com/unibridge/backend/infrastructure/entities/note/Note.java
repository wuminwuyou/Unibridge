package com.unibridge.backend.infrastructure.entities.note;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_note")
public class Note {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("content_type_code")
    private String contentTypeCode;
    @TableField("extended_uid")
    private String extendedUid;
    private String title;
    private String summary;
    @TableField("cover_url")
    private String coverUrl;
    @TableField("video_url")
    private String videoUrl;
    @TableField("video_duration")
    private Integer videoDuration;
    private String tags;
    private String status;
    private String visibility;
    @TableField("published_at")
    private LocalDateTime publishedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
