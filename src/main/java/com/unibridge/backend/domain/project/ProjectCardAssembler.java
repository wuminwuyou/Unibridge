package com.unibridge.backend.domain.project;

import com.unibridge.backend.domain.feed.dto.ContentTagLabel;
import com.unibridge.backend.domain.feed.dto.ContentVO;
import com.unibridge.backend.application.shared.dto.ProfileProjectItem;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 项目卡片 VO 组装（Feed {@link ContentVO} + 个人空间 {@link ProfileProjectItem}）。
 */
@Component
public class ProjectCardAssembler {

    private static final DateTimeFormatter FEED_PUBLISH_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter PROFILE_PUBLISH_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final ProjectPublisherEntityResolver publisherEntityResolver;

    public ProjectCardAssembler(ProjectPublisherEntityResolver publisherEntityResolver) {
        this.publisherEntityResolver = publisherEntityResolver;
    }

    public ContentVO toFeedProjectVo(Project project, double score) {
        ProjectPublisherEntityResolver.PublisherEntityContext publisher =
                publisherEntityResolver.resolve(project.getOwnerUid());
        LocalDateTime publishTime = resolvePublishTime(project.getPublishedAt(), project.getCreatedAt());

        return ContentVO.builder()
                .contentType("PROJECT")
                .projectCategory(project.getCategory())
                .recruitmentType(project.getRecruitmentType())
                .uid(project.getProjectUid())
                .title(project.getTitle())
                .preview(project.getPreview())
                .coverUrl(publisher.coverUrl())
                .logoSvgUrl(publisher.logoSvgUrl())
                .ownerOrganization(publisher.ownerOrganization())
                .projectTags(toTagLabels(project.getTags()))
                .level(project.getLevel())
                .teamSize(trimToNull(project.getTeamSize()))
                .duration(trimToNull(project.getDuration()))
                .views(0)
                .likes(0)
                .publishTime(formatFeedPublishTime(publishTime))
                .score(roundScore(score))
                .build();
    }

    public ProfileProjectItem toProfileProjectItem(Project project) {
        ProjectPublisherEntityResolver.PublisherEntityContext publisher =
                publisherEntityResolver.resolve(project.getOwnerUid());
        LocalDateTime publishTime = resolvePublishTime(project.getPublishedAt(), project.getCreatedAt());

        return ProfileProjectItem.builder()
                .uid(project.getProjectUid())
                .title(nullToEmpty(project.getTitle()))
                .preview(nullToEmpty(project.getPreview()))
                .coverUrl(publisher.coverUrl())
                .tags(toProfileTagLabels(project.getTags()))
                .category(project.getCategory())
                .recruitmentType(project.getRecruitmentType())
                .ownerOrganization(publisher.ownerOrganization())
                .logoSvgUrl(publisher.logoSvgUrl())
                .publishTime(formatProfilePublishTime(publishTime))
                .level(nullToEmpty(project.getLevel()))
                .teamSize(trimToNull(project.getTeamSize()))
                .duration(trimToNull(project.getDuration()))
                .status(project.getStatus())
                .build();
    }

    private List<ContentTagLabel> toTagLabels(String json) {
        return parseTagStrings(json).stream()
                .map(ContentTagLabel::new)
                .collect(Collectors.toList());
    }

    private List<ProfileProjectItem.TagLabel> toProfileTagLabels(String json) {
        return parseTagStrings(json).stream()
                .map(ProfileProjectItem.TagLabel::new)
                .collect(Collectors.toList());
    }

    private List<String> parseTagStrings(String json) {
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
        return time == null ? "" : time.format(PROFILE_PUBLISH_DATE_FORMATTER);
    }

    private double roundScore(double score) {
        return Math.round(score * 1000.0) / 1000.0;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
