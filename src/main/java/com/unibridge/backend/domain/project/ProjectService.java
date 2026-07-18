package com.unibridge.backend.domain.project;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.application.shared.ContentUidResolver;
import com.unibridge.backend.application.shared.UserVerificationService;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.project.dto.ProjectDetailResponse;
import com.unibridge.backend.domain.project.dto.PublishProjectDraftResponse;
import com.unibridge.backend.domain.project.dto.PublishProjectRequest;
import com.unibridge.backend.domain.project.dto.PublishProjectResponse;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.project.ProjectBody;
import com.unibridge.backend.infrastructure.entities.project.ProjectSecret;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectBodyMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectSecretMapper;
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
    private static final int MAX_DESCRIPTION_LENGTH = 5000;
    private static final String CHANNEL_ENTERPRISE = "enterprise";
    private static final String CHANNEL_CAMPUS = "campus";
    private static final String CATEGORY_COMMERCIAL = "COMMERCIAL";
    private static final String CATEGORY_RECRUITMENT = "RECRUITMENT";
    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_OPEN = "OPEN";
    private static final String COMMERCIAL_STATUS_PENDING = "PENDING_START";

    private static final Set<String> VALID_LEVELS = Set.of("S", "A", "B", "C", "D", "E");
    private static final Set<String> VALID_RECRUITMENT_TYPES = Set.of(
            "LAB_RECRUIT", "TEAM_RECRUIT", "CAMPUS_PRACTICE", "PERSONAL_RECRUIT"
    );
    private static final Set<String> PUBLIC_PROJECT_STATUSES = Set.of("OPEN", "ONGOING", "CLOSED");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final AccessService clientAccessService;
    private final ProjectMapper projectMapper;
    private final ProjectSecretMapper projectSecretMapper;
    private final ProjectBodyMapper projectBodyMapper;
    private final ContentUidResolver contentUidResolver;
    private final UserVerificationService userVerificationService;
    private final ProjectPublisherEntityResolver projectPublisherEntityResolver;

    public ProjectService(AccessService clientAccessService,
                                ProjectMapper projectMapper,
                                ProjectSecretMapper projectSecretMapper,
                                ProjectBodyMapper projectBodyMapper,
                                ContentUidResolver contentUidResolver,
                                UserVerificationService userVerificationService,
                                ProjectPublisherEntityResolver projectPublisherEntityResolver) {
        this.clientAccessService = clientAccessService;
        this.projectMapper = projectMapper;
        this.projectSecretMapper = projectSecretMapper;
        this.projectBodyMapper = projectBodyMapper;
        this.contentUidResolver = contentUidResolver;
        this.userVerificationService = userVerificationService;
        this.projectPublisherEntityResolver = projectPublisherEntityResolver;
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishProjectResponse createProject(String authorization, PublishProjectRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateRequest(request);
        if (PUBLISH_ACTION_PUBLISH.equals(normalizePublishAction(request.getPublishAction()))) {
            userVerificationService.requireVerifiedForProjectPublish(userUid);
            assertPublishPermission(userUid, request.getChannel());
        }

        Project project = new Project();
        project.setOwnerUid(userUid);
        project.setProjectUid(ProjectUidGenerator.generate(this::isProjectUidUnique));
        applyRequestToProject(project, request);
        projectMapper.insert(project);

        saveProjectBody(project.getProjectUid(), request.getDescription());
        syncCommercialSecret(project.getProjectUid(), request);

        Project persisted = projectMapper.selectById(project.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    @Transactional
    @CacheEvict(value = {"home_feed", "similar_notes", "project_feed", "note_feed"}, allEntries = true,
            condition = "#request.publishAction == 'PUBLISH'")
    public PublishProjectResponse updateProject(String authorization,
                                                String projectUid,
                                                PublishProjectRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        Project project = requireOwnedProject(projectUid, userUid);

        validateRequest(request);
        if (PUBLISH_ACTION_PUBLISH.equals(normalizePublishAction(request.getPublishAction()))) {
            userVerificationService.requireVerifiedForProjectPublish(userUid);
            assertPublishPermission(userUid, request.getChannel());
        }

        applyRequestToProject(project, request);
        projectMapper.updateById(project);

        saveProjectBody(project.getProjectUid(), request.getDescription());
        syncCommercialSecret(project.getProjectUid(), request);

        Project persisted = projectMapper.selectById(project.getId());
        return buildResponse(persisted, request.getPublishAction());
    }

    public PublishProjectDraftResponse getProjectDraft(String authorization, String projectUid) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        Project project = requireOwnedProject(projectUid, userUid);

        String contentDetail = null;
        if (CATEGORY_COMMERCIAL.equals(project.getCategory())) {
            ProjectSecret secret = projectSecretMapper.selectById(projectUid);
            if (secret != null) {
                contentDetail = secret.getEncryptedDescription();
            }
        }

        return PublishProjectDraftResponse.builder()
                .uid(project.getProjectUid())
                .publishAction(STATUS_DRAFT.equals(project.getStatus()) ? PUBLISH_ACTION_DRAFT : PUBLISH_ACTION_PUBLISH)
                .title(project.getTitle())
                .summary(project.getPreview())
                .channel(mapCategoryToChannel(project.getCategory()))
                .campusRecruitType(project.getRecruitmentType())
                .description(loadProjectBody(project.getProjectUid()))
                .contentDetail(contentDetail)
                .amountMin(extractBudgetMin(project.getBudget()))
                .amountMax(extractBudgetMax(project.getBudget()))
                .level(project.getLevel())
                .duration(project.getDuration())
                .skillTags(parseJsonStringList(project.getTags()))
                .deadline(project.getDeadline() == null ? null : project.getDeadline().toString())
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
        Project project = contentUidResolver.requireProjectByUid(projectUid);

        String currentUserUid = clientAccessService.requireCurrentUserUid(authorization);
        assertProjectReadable(project, currentUserUid);

        return buildProjectDetailResponse(project, currentUserUid);
    }

    private ProjectDetailResponse buildProjectDetailResponse(Project project,
                                                             String currentUserUid) {
        String channel = mapCategoryToChannel(project.getCategory());

        ProjectPublisherEntityResolver.OwnerContext ownerContext =
                projectPublisherEntityResolver.resolveOwner(project.getOwnerUid());

        return ProjectDetailResponse.builder()
                .uid(project.getProjectUid())
                .title(project.getTitle())
                .summary(project.getPreview())
                .channel(channel)
                .campusRecruitType(project.getRecruitmentType())
                .description(loadProjectBody(project.getProjectUid()))
                .amountMin(extractBudgetMin(project.getBudget()))
                .amountMax(extractBudgetMax(project.getBudget()))
                .level(project.getLevel())
                .duration(project.getDuration())
                .skillTags(parseJsonStringList(project.getTags()))
                .deadline(project.getDeadline() == null ? null : project.getDeadline().toString())
                .status(project.getStatus())
                .publishedAt(formatOffsetDateTime(project.getPublishedAt()))
                .updatedAt(formatOffsetDateTime(project.getUpdatedAt()))
                .owner(ProjectDetailResponse.Owner.builder()
                        .uid(ownerContext.uid())
                        .name(ownerContext.name())
                        .avatarUrl(ownerContext.avatarUrl())
                        .careerData(ownerContext.careerData())
                        .organization(ownerContext.organization())
                        .location(ownerContext.location())
                        .build())
                .build();
    }

    private void assertProjectReadable(Project project, String currentUserUid) {
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


    private Project requireOwnedProject(String projectUid, String userUid) {
        Project project = contentUidResolver.requireProjectByUid(projectUid);
        if (!userUid.equals(project.getOwnerUid())) {
            throw new BusinessException(403, "PROJECT_NOT_OWNER");
        }
        return project;
    }

    private boolean isProjectUidUnique(String projectUid) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Project::getProjectUid, projectUid);
        return projectMapper.selectCount(wrapper) == 0;
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
            int descCodePoints = request.getDescription().codePointCount(0, request.getDescription().length());
            if (descCodePoints >= MAX_DESCRIPTION_LENGTH) {
                throw BusinessException.badRequest("DESCRIPTION_TOO_LONG");
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

        if (CHANNEL_ENTERPRISE.equals(channel) && StringUtils.hasText(request.getAmountMax())) {
            parseAmount(request.getAmountMax());
        }
    }

    private String normalizePublishAction(String publishAction) {
        if (!StringUtils.hasText(publishAction)) {
            return "";
        }
        return publishAction.trim().toUpperCase(Locale.ROOT);
    }

    private void assertPublishPermission(String userUid, String channel) {
        String role = userVerificationService.resolveApprovedRole(userUid);
        if (!StringUtils.hasText(role)) {
            throw new BusinessException(403, "PROJECT_PUBLISH_FORBIDDEN");
        }

        boolean allowed = switch (role.toUpperCase(Locale.ROOT)) {
            case "PM" -> CHANNEL_ENTERPRISE.equals(channel);
            case "MENTOR" -> CHANNEL_ENTERPRISE.equals(channel) || CHANNEL_CAMPUS.equals(channel);
            case "STUDENT" -> CHANNEL_CAMPUS.equals(channel);
            default -> false;
        };

        if (!allowed) {
            throw new BusinessException(403, "PROJECT_PUBLISH_FORBIDDEN");
        }
    }

    private void applyRequestToProject(Project project, PublishProjectRequest request) {
        String channel = request.getChannel().trim();
        project.setCategory(CHANNEL_ENTERPRISE.equals(channel) ? CATEGORY_COMMERCIAL : CATEGORY_RECRUITMENT);
        project.setRecruitmentType(CHANNEL_CAMPUS.equals(channel) ? request.getCampusRecruitType().trim() : null);
        project.setTitle(request.getTitle().trim());
        project.setPreview(StringUtils.hasText(request.getSummary()) ? request.getSummary().trim() : "");
        project.setTags(toJsonStringList(request.getSkillTags()));
        project.setBudget(buildBudgetRange(request));
        project.setLevel(request.getLevel().trim());
        project.setDuration(trimToNull(request.getDuration()));
        project.setDeadline(StringUtils.hasText(request.getDeadline()) ? LocalDate.parse(request.getDeadline()) : null);

        if (PUBLISH_ACTION_DRAFT.equals(request.getPublishAction())) {
            project.setStatus(STATUS_DRAFT);
            project.setPublishedAt(null);
        } else {
            project.setStatus(STATUS_OPEN);
            project.setPublishedAt(LocalDateTime.now());
        }
    }

    /**
     * 将前端的 amountMin / amountMax 拼接为数据库 budget 区间字符串。
     * <ul>
     *   <li>两端均有值 → {@code "80000-120000"}</li>
     *   <li>仅 min 有值 → {@code "80000"}</li>
     *   <li>均无值 → null</li>
     * </ul>
     */
    private String buildBudgetRange(PublishProjectRequest request) {
        String min = trimToNull(request.getAmountMin());
        String max = trimToNull(request.getAmountMax());
        if (min == null && max == null) {
            return null;
        }
        if (max == null) {
            return min;
        }
        if (min == null) {
            return max;
        }
        return min + "-" + max;
    }

    /**
     * 商业项目发布时同步敏感数据到 t_project_secret。
     * 仅 channel=enterprise 时写入；recruitment 项目不产生秘密表记录。
     */
    private void syncCommercialSecret(String projectUid, PublishProjectRequest request) {
        if (CHANNEL_CAMPUS.equals(request.getChannel())) {
            return;
        }

        String encryptedDesc = trimToNull(request.getContentDetail());

        ProjectSecret existing = projectSecretMapper.selectById(projectUid);
        if (existing == null) {
            ProjectSecret secret = new ProjectSecret();
            secret.setProjectUid(projectUid);
            secret.setTotalBudget(BigDecimal.ZERO);
            secret.setEncryptedDescription(encryptedDesc);
            secret.setCommercialStatus(COMMERCIAL_STATUS_PENDING);
            try {
                projectSecretMapper.insert(secret);
            } catch (org.springframework.dao.DuplicateKeyException e) {
                existing = projectSecretMapper.selectById(projectUid);
                if (existing != null) {
                    if (encryptedDesc != null) {
                        existing.setEncryptedDescription(encryptedDesc);
                    }
                    projectSecretMapper.updateById(existing);
                }
            }
            return;
        }

        if (encryptedDesc != null) {
            existing.setEncryptedDescription(encryptedDesc);
            projectSecretMapper.updateById(existing);
        }
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

    private PublishProjectResponse buildResponse(Project project, String publishAction) {
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

    private String extractBudgetMin(String budget) {
        if (!StringUtils.hasText(budget)) {
            return null;
        }
        String trimmed = budget.trim();
        int idx = trimmed.indexOf('-');
        if (idx < 0) {
            return trimmed;
        }
        return trimmed.substring(0, idx).trim();
    }

    private String extractBudgetMax(String budget) {
        if (!StringUtils.hasText(budget)) {
            return null;
        }
        String trimmed = budget.trim();
        int idx = trimmed.indexOf('-');
        if (idx < 0) {
            return null;
        }
        return trimmed.substring(idx + 1).trim();
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

    private ProjectBody loadProjectBodyRow(String projectUid) {
        LambdaQueryWrapper<ProjectBody> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectBody::getProjectUid, projectUid).last("LIMIT 1");
        return projectBodyMapper.selectOne(wrapper);
    }

    private String loadProjectBody(String projectUid) {
        ProjectBody body = loadProjectBodyRow(projectUid);
        return body != null ? body.getDescription() : null;
    }

    private void saveProjectBody(String projectUid, String description) {
        ProjectBody existing = loadProjectBodyRow(projectUid);
        if (existing == null) {
            ProjectBody body = new ProjectBody();
            body.setProjectUid(projectUid);
            body.setDescription(StringUtils.hasText(description) ? description : null);
            projectBodyMapper.insert(body);
            return;
        }
        existing.setDescription(StringUtils.hasText(description) ? description : null);
        projectBodyMapper.updateById(existing);
    }
}
