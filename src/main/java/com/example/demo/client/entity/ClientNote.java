package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 笔记实体，映射 `note` 表。 */
@Data
@TableName("user_note")
public class ClientNote {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_id")
    private Long userId;
    /** 内容类型编码：图文 TX+11位 | 视频 VD+11位 */
    @TableField("content_type_code")
    private String contentTypeCode;
    private String title;
    private String summary;
    /** 图文笔记 Markdown 正文；视频笔记为 null */
    private String content;
    @TableField("cover_url")
    private String coverUrl;
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
    @TableField("published_at")
    private LocalDateTime publishedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
