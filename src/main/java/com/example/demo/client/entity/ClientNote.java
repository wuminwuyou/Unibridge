package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 笔记实体，映射 `note` 表。 */
@Data
@TableName("note")
public class ClientNote {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_id")
    private Long userId;
    @TableField("content_type")
    private String contentType;
    private String title;
    private String summary;
    private String content;
    @TableField("cover_url")
    private String coverUrl;
    private String images;
    @TableField("video_url")
    private String videoUrl;
    @TableField("video_duration")
    private Integer videoDuration;
    private String tags;
    @TableField("view_count")
    private Integer viewCount;
    @TableField("like_count")
    private Integer likeCount;
    @TableField("collect_count")
    private Integer collectCount;
    @TableField("comment_count")
    private Integer commentCount;
    private String status;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
