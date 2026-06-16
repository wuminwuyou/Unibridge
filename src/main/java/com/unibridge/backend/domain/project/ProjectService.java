package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.project.dto.ProjectDetailResponse;
import com.unibridge.backend.domain.project.dto.PublishProjectDraftResponse;
import com.unibridge.backend.domain.project.dto.PublishProjectRequest;
import com.unibridge.backend.domain.project.dto.PublishProjectResponse;
import com.unibridge.backend.infrastructure.entities.ClientProject;
import com.unibridge.backend.infrastructure.entities.ClientProjectCommercialSecret;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectCommercialSecretMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.util.ProjectUidGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ProjectService {

    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    private static final String PUBLISH_ACTION_DRAFT = "DRAFT";
    private static final String PUBLISH_ACTION_PUBLISH = "PUBLISH";
    private static final String CHANNEL_ENTERPRISE = "enterprise";
    private static final String CHANNEL_CAMPUS = "campus";
    private static final String CATEGORY_COMMERCIAL = "COMMERCIAL";
    private static final String CATEGORY_RECRUITMENT = "RECRUITMENT";
    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_OPEN = "OPEN";
    private static final String EDITOR_TYPE_MARKDOWN = "MARKDOWN";
    private static final String COMMERCIAL_STATUS_PENDING = "PENDING_START";

    private static final Set<String> VALID_LEVELS = Set.of("N", "R", "SR", "SSR", "UR");
    private static final Set<String> VALID_RECRUITMENT_TYPES = Set.of(
            "LAB_RECRUIT", "TEAM_RECRUIT", "CAMPUS_PRACTICE", "PERSONAL_RECRUIT"
    );
    private static final Set<String> PUBLIC_PROJECT_STATUSES = Set.of("OPEN", "ONGOING", "CLOSED");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final AccessService clientAccessService;
    private final ClientProjectMapper clientProjectMapper;
    private final ClientProjectCommercialSecretMapper commercialSecretMapper;
    private final UserAuthLinkMapper userAuthLinkMapper;
    private final ContentUidResolver contentUidResolver;

    public ProjectService(AccessService clientAccessService,
                                ClientProjectMapper clientProjectMapper,
                                ClientProjectCommercialSecretMapper commercialSecretMapper,
                                UserAuthLinkMapper userAuthLinkMapper,
                                ContentUidResolver contentUidResolver) {
        this.clientAccessService = clientAccessService;
        this.clientProjectMapper = clientProjectMapper;
        this.commercialSecretMapper = commercialSecretMapper;
        this.userAuthLinkMapper = userAuthLinkMapper;
        this.contentUidResolver = contentUidResolver;
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishProjectResponse createProject(String authorization, PublishProjectRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateRequest(request);
        assertPublishPermission(userUid, request.getChannel());

        ClientProject project = new ClientProject();
        project.setOwnerUid(userUid);
        project.setProjectUid(ProjectUidGenerator.generate(this::isProjectUidUnique));
        applyRequestToProject(project, request);
        clientProjectMapper.insert(project);

        syncCommercialSecret(project.getProjectUid(), request);
        ClientProject persisted = clientProjectMapper.selectById(project.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishProjectResponse updateProject(String authorization,
                                                String projectUid,
                                                PublishProjectRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        ClientProject project = requireOwnedProject(projectUid, userUid);

        validateRequest(request);
        assertPublishPermission(userUid, request.getChannel());

        applyRequestToProject(project, request);
        clientProjectMapper.updateById(project);

        syncCommercialSecret(project.getProjectUid(), request);
        ClientProject persisted = clientProjectMapper.selectById(project.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    public PublishProjectDraftResponse getProjectDraft(String authorization, String projectUid) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        ClientProject project = requireOwnedProject(projectUid, userUid);
        ClientProjectCommercialSecret secret = loadCommercialSecret(project.getProjectUid());

        return PublishProjectDraftResponse.builder()
                .uid(project.getProjectUid())
                .publishAction(STATUS_DRAFT.equals(project.getStatus()) ? PUBLISH_ACTION_DRAFT : PUBLISH_ACTION_PUBLISH)
                .title(project.getTitle())
                .summary(project.getPreview())
                .channel(mapCategoryToChannel(project.getCategory()))
                .campusRecruitType(project.getRecruitmentType())
                .description(project.getDescription())
                .amount(formatAmount(secret == null ? null : secret.getTotalBudget()))
                .level(project.getLevel())
                .duration(project.getDuration())
                .teamSize(project.getTeamSize())
                .skillTags(parseJsonStringList(project.getTags()))
                .deadline(project.getDeadline() == null ? null : project.getDeadline().toString())
                .descriptionEditorType(defaultEditorType(project.getEditorType()))
                .build();
    }

    /**
     * 查询项目详情（需登录鉴权）。
     * <ul>
     *   <li>已发布（OPEN/ONGOING/CLOSED）：登录后可见</li>
     *   <li>草稿（DRAFT）：仅 owner 可读；非 owner 返回 403</li>
     * </ul>
     */
    public ProjectDetailResponse getProjectDetail(String authorization, String projectUid) {
        ClientProject project = contentUidResolver.requireProjectByUid(projectUid);

        String currentUserUid = clientAccessService.requireCurrentUserUid(authorization);
        assertProjectReadable(project, currentUserUid);

        ClientProjectCommercialSecret secret = loadCommercialSecret(project.getProjectUid());
        return buildProjectDetailResponse(project, secret, currentUserUid);
    }

    private ProjectDetailResponse buildProjectDetailResponse(ClientProject project,
                                                             ClientProjectCommercialSecret secret,
                                                             String currentUserUid) {
        String channel = mapCategoryToChannel(project.getCategory());
        String amount = null;
        boolean isOwner = currentUserUid != null && currentUserUid.equals(project.getOwnerUid());
        if (CATEGORY_COMMERCIAL.equals(project.getCategory()) && secret != null && isOwner) {
            amount = formatAmount(secret.getTotalBudget());
        }

        return ProjectDetailResponse.builder()
                .uid(project.getProjectUid())
                .title(project.getTitle())
                .summary(project.getPreview())
                .channel(channel)
                .campusRecruitType(project.getRecruitmentType())
                .description(project.getDescription())
                .descriptionEditorType(defaultEditorType(project.getEditorType()))
                .amount(amount)
                .level(project.getLevel())
                .duration(project.getDuration())
                .teamSize(project.getTeamSize())
                .skillTags(parseJsonStringList(project.getTags()))
                .deadline(project.getDeadline() == null ? null : project.getDeadline().toString())
                .status(project.getStatus())
                .publishedAt(formatOffsetDateTime(project.getPublishedAt()))
                .updatedAt(formatOffsetDateTime(project.getUpdatedAt()))
                .build();
    }

    private void assertProjectReadable(ClientProject project, String currentUserUid) {
        if (PUBLIC_PROJECT_STATUSES.contains(project.getStatus())) {
            return;
        }
        if (!STATUS_DRAFT.equals(project.getStatus())) {
            throw BusinessException.notFound("PROJECT_NOT_FOUND");
        }
        if (!currentUserUid.equals(project.getOwnerUid())) {
            throw new BusinessException(403, "PROJECT_NOT_OWNER");
        }
    }

    private String defaultEditorType(String editorType) {
        return StringUtils.hasText(editorType) ? editorType : EDITOR_TYPE_MARKDOWN;
    }

    private ClientProject requireOwnedProject(String projectUid, String userUid) {
        ClientProject project = contentUidResolver.requireProjectByUid(projectUid);
        if (!userUid.equals(project.getOwnerUid())) {
            throw new BusinessException(403, "PROJECT_NOT_OWNER");
        }
        return project;
    }

    private boolean isProjectUidUnique(String projectUid) {
        LambdaQueryWrapper<ClientProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientProject::getProjectUid, projectUid);
        return clientProjectMapper.selectCount(wrapper) == 0;
    }

    private void validateRequest(PublishProjectRequest request) {
        if (request == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        String publishAction = normalizeRequired(request.getPublishAction(), "publishAction");
        if (!PUBLISH_ACTION_DRAFT.equals(publishAction) && !PUBLISH_ACTION_PUBLISH.equals(publishAction)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (!StringUtils.hasText(request.getTitle())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        String channel = normalizeRequired(request.getChannel(), "channel");
        if (!CHANNEL_ENTERPRISE.equals(channel) && !CHANNEL_CAMPUS.equals(channel)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (CHANNEL_CAMPUS.equals(channel)) {
            String recruitType = normalizeRequired(request.getCampusRecruitType(), "campusRecruitType");
            if (!VALID_RECRUITMENT_TYPES.contains(recruitType)) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
        } else if (StringUtils.hasText(request.getCampusRecruitType())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        String level = normalizeRequired(request.getLevel(), "level");
        if (!VALID_LEVELS.contains(level)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (request.getSkillTags() == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }

        if (PUBLISH_ACTION_PUBLISH.equals(publishAction)) {
            if (!StringUtils.hasText(request.getSummary())) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
            if (!StringUtils.hasText(request.getDescription())) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
            if (request.getSkillTags().isEmpty()) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
        }

        if (StringUtils.hasText(request.getDeadline())) {
            try {
                LocalDate.parse(request.getDeadline());
            } catch (DateTimeParseException ex) {
                throw BusinessException.badRequest("VALIDATION_FAILED");
            }
        }

        if (CHANNEL_ENTERPRISE.equals(channel) && StringUtils.hasText(request.getAmount())) {
            parseAmount(request.getAmount());
        }
    }

    private void assertPublishPermission(String userUid, String channel) {
        UserAuthLink authLink = loadCurrentAuthLink(userUid);
        if (authLink == null || !StringUtils.hasText(authLink.getRole())) {
            throw new BusinessException(403, "PROJECT_PUBLISH_FORBIDDEN");
        }

        String role = authLink.getRole().toUpperCase(Locale.ROOT);
        boolean allowed = switch (role) {
            case "PM" -> CHANNEL_ENTERPRISE.equals(channel);
            case "MENTOR" -> CHANNEL_ENTERPRISE.equals(channel) || CHANNEL_CAMPUS.equals(channel);
            case "STUDENT" -> CHANNEL_CAMPUS.equals(channel);
            default -> false;
        };

        if (!allowed) {
            throw new BusinessException(403, "PROJECT_PUBLISH_FORBIDDEN");
        }
    }

    private UserAuthLink loadCurrentAuthLink(String userUid) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserUid, userUid)
                .eq(UserAuthLink::getIsActive, 1)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        return userAuthLinkMapper.selectOne(wrapper);
    }

    private void applyRequestToProject(ClientProject project, PublishProjectRequest request) {
        String channel = request.getChannel().trim();
        project.setCategory(CHANNEL_ENTERPRISE.equals(channel) ? CATEGORY_COMMERCIAL : CATEGORY_RECRUITMENT);
        project.setRecruitmentType(CHANNEL_CAMPUS.equals(channel) ? request.getCampusRecruitType().trim() : null);
        project.setTitle(request.getTitle().trim());
        project.setPreview(StringUtils.hasText(request.getSummary()) ? request.getSummary().trim() : "");
        project.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription() : null);
        project.setEditorType(EDITOR_TYPE_MARKDOWN);
        project.setTags(toJsonStringList(request.getSkillTags()));
        project.setLevel(request.getLevel().trim());
        project.setDuration(trimToNull(request.getDuration()));
        project.setTeamSize(trimToNull(request.getTeamSize()));
        project.setDeadline(StringUtils.hasText(request.getDeadline()) ? LocalDate.parse(request.getDeadline()) : null);

        if (PUBLISH_ACTION_DRAFT.equals(request.getPublishAction())) {
            project.setStatus(STATUS_DRAFT);
            project.setPublishedAt(null);
        } else {
            project.setStatus(STATUS_OPEN);
            project.setPublishedAt(LocalDateTime.now());
        }
    }

    private void syncCommercialSecret(String projectUid, PublishProjectRequest request) {
        if (CHANNEL_CAMPUS.equals(request.getChannel())) {
            commercialSecretMapper.deleteById(projectUid);
            return;
        }

        BigDecimal budget = parseAmount(request.getAmount());
        ClientProjectCommercialSecret existing = commercialSecretMapper.selectById(projectUid);
        if (existing == null) {
            ClientProjectCommercialSecret secret = new ClientProjectCommercialSecret();
            secret.setProjectUid(projectUid);
            secret.setTotalBudget(budget);
            secret.setCommercialStatus(COMMERCIAL_STATUS_PENDING);
            // 并发场景下，若两个请求同时 delete→insert，数据库主键/唯一约束会拒绝
            try {
                commercialSecretMapper.insert(secret);
            } catch (org.springframework.dao.DuplicateKeyException e) {
                existing = commercialSecretMapper.selectById(projectUid);
                if (existing != null) {
                    existing.setTotalBudget(budget);
                    commercialSecretMapper.updateById(existing);
                }
            }
            return;
        }

        // 仅更新 totalBudget，避免全字段覆盖
        ClientProjectCommercialSecret patch = new ClientProjectCommercialSecret();
        patch.setProjectUid(projectUid);
        patch.setTotalBudget(budget);
        LambdaUpdateWrapper<ClientProjectCommercialSecret> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(ClientProjectCommercialSecret::getProjectUid, projectUid);
        commercialSecretMapper.update(patch, wrapper);
    }

    private ClientProjectCommercialSecret loadCommercialSecret(String projectUid) {
        return commercialSecretMapper.selectById(projectUid);
    }

    private BigDecimal parseAmount(String amountText) {
        if (!StringUtils.hasText(amountText)) {
            return BigDecimal.ZERO;
        }
        try {
            BigDecimal value = new BigDecimal(amountText.trim());
            if (value.compareTo(BigDecimal.ZERO) < 0) {
                throw BusinessException.badRequest("AMOUNT_PARSE_FAILED");
            }
            return value;
        } catch (NumberFormatException ex) {
            throw BusinessException.badRequest("AMOUNT_PARSE_FAILED");
        }
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount.stripTrailingZeros().toPlainString();
    }

    private PublishProjectResponse buildResponse(ClientProject project, String publishAction) {
        return PublishProjectResponse.builder()
                .uid(project.getProjectUid())
                .publishAction(publishAction)
                .status(project.getStatus())
                .category(project.getCategory())
                .recruitmentType(project.getRecruitmentType())
                .publishedAt(formatOffsetDateTime(project.getPublishedAt()))
                .createdAt(formatOffsetDateTime(project.getCreatedAt()))
                .updatedAt(formatOffsetDateTime(project.getUpdatedAt()))
                .build();
    }

    private String mapCategoryToChannel(String category) {
        if (CATEGORY_RECRUITMENT.equals(category)) {
            return CHANNEL_CAMPUS;
        }
        return CHANNEL_ENTERPRISE;
    }

    private String normalizeRequired(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String toJsonStringList(List<String> values) {
        try {
            return OBJECT_MAPPER.writeValueAsString(values == null ? List.of() : values);
        } catch (JsonProcessingException ex) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
    }

    private List<String> parseJsonStringList(String jsonText) {
        if (!StringUtils.hasText(jsonText)) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(jsonText, STRING_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private String formatOffsetDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZONE_SHANGHAI).format(ISO_OFFSET_FORMATTER);
    }
}
