package com.unibridge.backend.domain.note;

import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.feed.dto.ContentVO;
import com.unibridge.backend.application.shared.dto.ProfileNoteItem;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.note.NoteCounter;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteCounterMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 笔记卡片 VO 组装（Feed {@link ContentVO} + 个人空间 {@link ProfileNoteItem}）。
 */
@Component
public class NoteCardAssembler {

    private static final String CONTENT_TYPE_NOTE = "NOTE";
    private static final String NOTE_CODE_PREFIX_IMAGE_TEXT = "TX";
    private static final String NOTE_CODE_PREFIX_VIDEO = "VD";
    private static final String NOTE_TYPE_IMAGE_TEXT = "IMAGE_TEXT";
    private static final String NOTE_TYPE_VIDEO = "VIDEO";

    private static final DateTimeFormatter FEED_PUBLISH_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter PROFILE_PUBLISH_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter PROFILE_UPDATE_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final NoteAuthorResolver noteAuthorResolver;
    private final NoteCounterMapper noteCounterMapper;

    public NoteCardAssembler(NoteAuthorResolver noteAuthorResolver,
                             NoteCounterMapper noteCounterMapper) {
        this.noteAuthorResolver = noteAuthorResolver;
        this.noteCounterMapper = noteCounterMapper;
    }

    public ContentVO toFeedNoteVo(Note note, double score) {
        NoteAuthorResolver.NoteAuthorContext author = noteAuthorResolver.resolve(note.getUserUid());
        LocalDateTime publishTime = resolvePublishTime(note.getPublishedAt(), note.getCreatedAt());
        NoteCounter counter = loadCounter(note.getContentTypeCode());

        return ContentVO.builder()
                .contentType(CONTENT_TYPE_NOTE)
                .noteType(resolveNoteType(note.getContentTypeCode()))
                .uid(ContentUidResolver.notePublicUid(note))
                .title(note.getTitle())
                .summary(note.getSummary())
                .coverUrl(note.getCoverUrl())
                .noteTags(parseTags(note.getTags()))
                .authorNickName(author.authorNickName())
                .authorOrganization(author.authorOrganization())
                .authorAvatar(author.authorAvatar())
                .videoDuration(formatVideoDuration(note.getVideoDuration(), note.getContentTypeCode()))
                .views(nullSafe(counter.getViewCount()))
                .likes(nullSafe(counter.getLikeCount()))
                .favorites(nullSafe(counter.getCollectCount()))
                .comments(nullSafe(counter.getCommentCount()))
                .publishTime(formatFeedPublishTime(publishTime))
                .score(roundScore(score))
                .build();
    }

    public ProfileNoteItem toProfileNoteItem(Note note) {
        NoteAuthorResolver.NoteAuthorContext author = noteAuthorResolver.resolve(note.getUserUid());
        LocalDateTime publishTime = resolvePublishTime(note.getPublishedAt(), note.getCreatedAt());
        NoteCounter counter = loadCounter(note.getContentTypeCode());

        return ProfileNoteItem.builder()
                .uid(note.getContentTypeCode())
                .title(nullToEmpty(note.getTitle()))
                .summary(nullToEmpty(note.getSummary()))
                .contentType(mapNoteContentTypeDisplay(note.getContentTypeCode()))
                .tags(parseTags(note.getTags()))
                .cover(nullToEmpty(note.getCoverUrl()))
                .authorNickName(author.authorNickName())
                .authorOrganization(author.authorOrganization())
                .authorAvatar(author.authorAvatar())
                .videoDuration(formatVideoDuration(note.getVideoDuration(), note.getContentTypeCode()))
                .views(nullSafe(counter.getViewCount()))
                .likes(nullSafe(counter.getLikeCount()))
                .comments(nullSafe(counter.getCommentCount()))
                .favorites(nullSafe(counter.getCollectCount()))
                .publishTime(formatProfilePublishTime(publishTime))
                .updateTime(formatProfileUpdateTime(note.getUpdatedAt()))
                .status(note.getStatus())
                .visibility(note.getVisibility())
                .build();
    }

    private NoteCounter loadCounter(String contentTypeCode) {
        LambdaQueryWrapper<NoteCounter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteCounter::getContentTypeCode, contentTypeCode).last("LIMIT 1");
        NoteCounter counter = noteCounterMapper.selectOne(wrapper);
        if (counter == null) {
            counter = new NoteCounter();
            counter.setViewCount(0);
            counter.setLikeCount(0);
            counter.setCollectCount(0);
            counter.setCommentCount(0);
        }
        return counter;
    }

    private String resolveNoteType(String contentTypeCode) {
        if (!StringUtils.hasText(contentTypeCode)) {
            return NOTE_TYPE_IMAGE_TEXT;
        }
        if (contentTypeCode.startsWith(NOTE_CODE_PREFIX_VIDEO)) {
            return NOTE_TYPE_VIDEO;
        }
        return NOTE_TYPE_IMAGE_TEXT;
    }

    private String mapNoteContentTypeDisplay(String contentTypeCode) {
        if (!StringUtils.hasText(contentTypeCode)) {
            return "";
        }
        if (contentTypeCode.startsWith(NOTE_CODE_PREFIX_IMAGE_TEXT)) {
            return "图文";
        }
        if (contentTypeCode.startsWith(NOTE_CODE_PREFIX_VIDEO)) {
            return "视频";
        }
        return "";
    }

    private String formatVideoDuration(Integer seconds, String contentTypeCode) {
        if (!StringUtils.hasText(contentTypeCode) || !contentTypeCode.startsWith(NOTE_CODE_PREFIX_VIDEO)) {
            return null;
        }
        if (seconds == null || seconds <= 0) {
            return null;
        }
        int minutes = seconds / 60;
        int remainSeconds = seconds % 60;
        return String.format("%02d:%02d", minutes, remainSeconds);
    }

    private List<String> parseTags(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(json, STRING_LIST_TYPE);
        } catch (Exception ex) {
            return List.of();
        }
    }

    private LocalDateTime resolvePublishTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : (createdAt != null ? createdAt : LocalDateTime.now());
    }

    private String formatFeedPublishTime(LocalDateTime time) {
        return time == null ? "" : time.format(FEED_PUBLISH_TIME_FORMATTER);
    }

    private String formatProfilePublishTime(LocalDateTime time) {
        return time == null ? "" : time.format(PROFILE_PUBLISH_TIME_FORMATTER);
    }

    private String formatProfileUpdateTime(LocalDateTime time) {
        return time == null ? "" : time.format(PROFILE_UPDATE_DATE_FORMATTER);
    }

    private int nullSafe(Integer value) {
        return value == null ? 0 : value;
    }

    private double roundScore(double score) {
        return Math.round(score * 1000.0) / 1000.0;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
