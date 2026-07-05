package com.unibridge.backend.domain.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.application.shared.UserVerificationService;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.domain.user.dto.ProfileHomeResponse;
import com.unibridge.backend.application.shared.dto.ProfileNoteItem;
import com.unibridge.backend.domain.user.dto.ProfileNotesResponse;
import com.unibridge.backend.application.shared.dto.ProfileProjectItem;
import com.unibridge.backend.domain.user.dto.ProfileProjectsResponse;
import com.unibridge.backend.domain.user.dto.ProfileMenuResponse;
import com.unibridge.backend.domain.user.dto.ProfileSpaceResponse;
import com.unibridge.backend.domain.user.dto.UserVerifiedPreviewResponse;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.project.ProjectSecret;
import com.unibridge.backend.infrastructure.entities.team.Team;
import com.unibridge.backend.infrastructure.entities.team.TeamMember;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectSecretMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.util.IpLocationUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);
    private static final String DEFAULT_AVATAR_TEXT = "U";
    private static final DateTimeFormatter JOIN_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter PROJECT_PUBLISH_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter NOTE_PUBLISH_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter NOTE_UPDATE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";
    private static final String NOTE_STATUS_DELETED = "DELETED";
    private static final String NOTE_VISIBILITY_PUBLIC = "PUBLIC";
    private static final int DEFAULT_PROJECT_LIMIT = 4;
    private static final int DEFAULT_NOTE_LIMIT = 3;
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };
    /** career_data 对象字段的展示顺序 */
    private static final List<String> CAREER_FIELD_ORDER = List.of(
            "school", "major", "grade", "degree", "title", "department", "company"
    );

    @Autowired
    private AccessService accessService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private TeamMapper teamMapper;

    @Autowired
    private TeamMemberMapper teamMemberMapper;

    @Autowired
    private TenantOrgProfileMapper tenantOrgProfileMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    @Autowired
    private UserVerificationService userVerificationService;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private ProjectSecretMapper projectSecretMapper;

    @Autowired
    private NoteMapper noteMapper;

    @Autowired
    private UserIdentityMapper userIdentityMapper;

    /** UserProfileMenu 顶部菜单初始化数据，含三级认证状态。 */
    public ProfileMenuResponse getProfileMenu(String authorization, String queryUid) {
        String targetUserUid = resolveQueryTargetUid(queryUid, null, null,
                accessService.resolveOptionalCurrentUserUid(authorization));
        if (targetUserUid == null) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        User user = loadUserByUid(targetUserUid);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        UserProfile profile = loadProfile(targetUserUid);

        return ProfileMenuResponse.builder()
                .userUid(targetUserUid)
                .nickname(nullSafe(profile == null ? null : profile.getNickName()))
                .level(nullSafe(profile == null ? null : profile.getLevel()))
                .avatarUrl(nullSafe(profile == null ? null : profile.getAvatarUrl()))
                .verifiedOrganization(userVerificationService.resolveVerifiedOrganization(targetUserUid))
                .verifyStatus(userVerificationService.resolveVerifyStatus(targetUserUid))
                .build();
    }

    /**
     * 个人空间页壳数据：Hero + Sidebar + 关联团队卡片，一次性返回。
     * <p>
     * 未登录或非 CLIENT_USER token 时仍然可查看他人主页（需要 queryUid），
     * 此时 currentUserUid 为 null，viewingOwnSpace 为 false。
     * </p>
     *
     * @param authorization   Authorization 请求头（可空；用于判断是否 viewingOwnSpace）
     * @param queryUid        目标用户 UID（如 {@code US00000000002}）；为空时视为查看 token 当前用户
     * @param legacyUserUid   兼容旧 query {@code userUid}
     * @param legacyUserId    兼容旧 query {@code userId}
     * @param request         原始请求，用于解析 IP 属地
     */
    public ProfileSpaceResponse getProfileSpace(String authorization, String queryUid, String legacyUserUid,
                                                Long legacyUserId, HttpServletRequest request) {
        // 可选登录：未登录时 currentUserUid = null
        String currentUserUid = accessService.resolveOptionalCurrentUserUid(authorization);
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId, currentUserUid);
        if (targetUserUid == null) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        User user = loadUserByUid(targetUserUid);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        UserProfile profile = loadProfile(targetUserUid);
        UserOrganizationBinding currentAuthLink = loadCurrentAuthLink(targetUserUid);
        ProfileSpaceResponse.BaseInfo baseInfo = buildBaseInfo(targetUserUid, profile, currentAuthLink);
        ProfileSpaceResponse.ExtendInfo extendInfo = buildExtendInfo(user, profile, request);
        List<ProfileSpaceResponse.AssociatedTeam> associatedTeams = loadAssociatedTeams(targetUserUid);

        return ProfileSpaceResponse.builder()
                .userUid(targetUserUid)
                .viewingOwnSpace(isSameUid(currentUserUid, targetUserUid))
                .baseInfo(baseInfo)
                .extendInfo(extendInfo)
                .associatedTeam(associatedTeams)
                .honors(Collections.emptyList())
                .activityHeatmap(Collections.emptyList())
                .build();
    }

    /** 个人空间「主页」Tab：项目 + 笔记预览列表。 */
    public ProfileHomeResponse getProfileHome(String authorization,
                                              String queryUid,
                                              String legacyUserUid,
                                              Long legacyUserId,
                                              Integer projectLimit,
                                              Integer noteLimit) {
        String currentUserUid = accessService.requireCurrentUserUid(authorization);
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId, currentUserUid);
        if (targetUserUid == null) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        assertUserExists(targetUserUid);

        boolean viewingOwnSpace = isSameUid(currentUserUid, targetUserUid);

        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_NOTE_LIMIT);

        UserProfile profile = loadProfile(targetUserUid);
        List<Project> projects = loadProjects(targetUserUid, resolvedProjectLimit, 0);
        List<Note> notes = loadNotes(targetUserUid, null, resolvedNoteLimit, 0, viewingOwnSpace);

        return ProfileHomeResponse.builder()
                .uid(targetUserUid)
                .viewingOwnSpace(viewingOwnSpace)
                .projects(buildProjectItems(projects, profile, targetUserUid))
                .notes(buildNoteItems(notes))
                .projectTotal(countProjects(targetUserUid))
                .noteTotal(countNotes(targetUserUid, null, viewingOwnSpace))
                .build();
    }

    public ProfileProjectsResponse getProfileProjects(String authorization,
                                                      String queryUid,
                                                      String legacyUserUid,
                                                      Long legacyUserId,
                                                      Integer page,
                                                      Integer pageSize) {
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId,
                accessService.resolveOptionalCurrentUserUid(authorization));
        if (targetUserUid == null) {
            throw BusinessException.badRequest("USER_UID_REQUIRED");
        }
        assertUserExists(targetUserUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        UserProfile profile = loadProfile(targetUserUid);
        List<Project> projects = loadProjects(targetUserUid, resolvedPageSize, offset);
        long total = countProjects(targetUserUid);

        return ProfileProjectsResponse.builder()
                .userUid(targetUserUid)
                .projects(buildProjectItems(projects, profile, targetUserUid))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public ProfileNotesResponse getProfileNotes(String authorization,
                                                String queryUid,
                                                String legacyUserUid,
                                                Long legacyUserId,
                                                Integer page,
                                                Integer pageSize,
                                                String contentType) {
        String currentUserUid = accessService.requireCurrentUserUid(authorization);
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId, currentUserUid);
        if (targetUserUid == null) {
            throw BusinessException.badRequest("USER_UID_REQUIRED");
        }
        assertUserExists(targetUserUid);

        boolean viewingOwnSpace = isSameUid(currentUserUid, targetUserUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        List<Note> notes = loadNotes(targetUserUid, dbContentType, resolvedPageSize, offset, viewingOwnSpace);
        long total = countNotes(targetUserUid, dbContentType, viewingOwnSpace);

        return ProfileNotesResponse.builder()
                .userUid(targetUserUid)
                .notes(buildNoteItems(notes))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private ProfileSpaceResponse.BaseInfo buildBaseInfo(String userUid, UserProfile profile, UserOrganizationBinding currentAuthLink) {
        String nickname = nullSafe(profile == null ? null : profile.getNickName());
        String avatarUrl = nullSafe(profile == null ? null : profile.getAvatarUrl());
        String bio = nullSafe(profile == null ? null : profile.getIntro());
        String level = nullSafe(profile == null ? null : profile.getLevel());

        // position：user_auth_link.role（当前活跃身份 is_active=1，含 PENDING 待审核）
        String position = mapAuthRoleToPosition(currentAuthLink == null ? null : currentAuthLink.getRole());
        String organization = userVerificationService.resolveVerifiedOrganization(userUid);
        String verifyStatusCode = userVerificationService.resolveVerifyStatus(userUid);

        return ProfileSpaceResponse.BaseInfo.builder()
                .nickname(nickname)
                .avatarText(resolveAvatarText(nickname))
                .avatarUrl(avatarUrl)
                .isVerified(!UserVerificationService.STATUS_UNVERIFIED.equals(verifyStatusCode))
                .organization(organization)
                .position(position)
                .bio(bio)
                .level(level)
                .build();
    }

    private String resolveOrganization(UserOrganizationBinding authLink, UserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getUserUid())) {
            String verifiedOrg = userVerificationService.resolveVerifiedOrganization(profile.getUserUid());
            if (StringUtils.hasText(verifiedOrg)) {
                return verifiedOrg;
            }
        }
        if (authLink != null && authLink.getEntityCode() != null) {
            LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(TenantOrgProfile::getEntityCode, authLink.getEntityCode()).last("LIMIT 1");
            TenantOrgProfile entityProfile = tenantOrgProfileMapper.selectOne(wrapper);
            if (entityProfile != null && entityProfile.getName() != null && !entityProfile.getName().isBlank()) {
                return entityProfile.getName();
            }
        }
        return null;
    }

    private ProfileSpaceResponse.ExtendInfo buildExtendInfo(User user,
                                                            UserProfile profile,
                                                            HttpServletRequest request) {
        String userUid = user.getUserUid();
        return ProfileSpaceResponse.ExtendInfo.builder()
                .notice(nullSafe(profile == null ? null : profile.getAnnouncement()))
                .verifyStatus(userVerificationService.resolveVerifyStatusDisplayLabel(userUid))
                .ipLocation(resolveIpLocation(request))
                .joinDate(formatJoinDate(user.getCreatedAt()))
                .careerData(parseCareerData(profile == null ? null : profile.getCareerData()))
                .skills(parseJsonStringList(profile == null ? null : profile.getBioData()))
                .build();
    }

    private UserProfile loadProfile(String userUid) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(wrapper);
    }

    private UserIdentity loadIdentity(String userUid) {
        LambdaQueryWrapper<UserIdentity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(wrapper);
    }

    private UserOrganizationBinding loadCurrentAuthLink(String userUid) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getIsActive, 1)
                .orderByDesc(UserOrganizationBinding::getUpdatedAt)
                .last("LIMIT 1");
        return userOrganizationBindingMapper.selectOne(wrapper);
    }

    private List<ProfileSpaceResponse.AssociatedTeam> loadAssociatedTeams(String userUid) {
        Map<String, Team> teamMap = new LinkedHashMap<>();

        LambdaQueryWrapper<TeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(TeamMember::getUserUid, userUid);
        for (TeamMember membership : teamMemberMapper.selectList(memberWrapper)) {
            Team team = loadTeamByUid(membership.getTeamUid());
            if (team != null && team.getTeamUid() != null && !team.getTeamUid().isBlank()) {
                teamMap.putIfAbsent(team.getTeamUid(), team);
            }
        }

        LambdaQueryWrapper<Team> ownerWrapper = new LambdaQueryWrapper<>();
        ownerWrapper.eq(Team::getOwnerUid, userUid);
        for (Team team : teamMapper.selectList(ownerWrapper)) {
            if (team != null && team.getTeamUid() != null && !team.getTeamUid().isBlank()) {
                teamMap.putIfAbsent(team.getTeamUid(), team);
            }
        }

        if (teamMap.isEmpty()) {
            return Collections.emptyList();
        }

        return teamMap.values().stream()
                .filter(this::isTeamPubliclyVisible)
                .sorted(this::compareAssociatedTeamOrder)
                .map(this::toAssociatedTeamItem)
                .collect(Collectors.toList());
    }

    /** LAB 优先，同类型按名称排序。 */
    private int compareAssociatedTeamOrder(Team left, Team right) {
        boolean leftLab = "LAB".equalsIgnoreCase(left.getType());
        boolean rightLab = "LAB".equalsIgnoreCase(right.getType());
        if (leftLab != rightLab) {
            return leftLab ? -1 : 1;
        }
        return nullSafe(left.getTeamName()).compareTo(nullSafe(right.getTeamName()));
    }

    private ProfileSpaceResponse.AssociatedTeam toAssociatedTeamItem(Team team) {
        String entryPath = "LAB".equalsIgnoreCase(team.getType())
                ? "/lab/" + team.getTeamUid()
                : "/team/" + team.getTeamUid();
        return ProfileSpaceResponse.AssociatedTeam.builder()
                .teamUid(team.getTeamUid())
                .name(nullSafe(team.getTeamName()))
                .description(nullSafe(team.getIntro()))
                .entryPath(entryPath)
                .build();
    }

    /** 将 user_auth_link.role 映射为前端展示的身份文案。 */
    private String mapAuthRoleToPosition(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "PM" -> "企业项目经理";
            case "MENTOR" -> "导师";
            case "COUNSELOR" -> "辅导员";
            case "STUDENT" -> "学生";
            default -> role;
        };
    }

    private void assertUserExists(String userUid) {
        if (loadUserByUid(userUid) == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
    }

    private User loadUserByUid(String userUid) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUserUid, userUid).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    private Team loadTeamByUid(String teamUid) {
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getTeamUid, teamUid).last("LIMIT 1");
        return teamMapper.selectOne(wrapper);
    }

    /** 团队对外可见：account_status=ACTIVE；LAB 还须 audit_status=APPROVED。 */
    private boolean isTeamPubliclyVisible(Team team) {
        if (team == null || team.getAccountStatus() == null) {
            return false;
        }
        if (!"ACTIVE".equalsIgnoreCase(team.getAccountStatus())) {
            return false;
        }
        if ("LAB".equalsIgnoreCase(team.getType())) {
            return "APPROVED".equalsIgnoreCase(team.getAuditStatus());
        }
        return true;
    }

    private String resolveIpLocation(HttpServletRequest request) {
        if (request == null) {
            return IpLocationUtils.UNKNOWN_LOCATION;
        }
        try {
            return IpLocationUtils.resolveLocationFromRequest(request);
        } catch (Exception ex) {
            log.warn("解析 IP 属地失败: {}", ex.getMessage());
            return IpLocationUtils.UNKNOWN_LOCATION;
        }
    }

    private String formatJoinDate(LocalDateTime createdAt) {
        return createdAt == null ? "" : createdAt.format(JOIN_DATE_FORMATTER);
    }

    /**
     * 解析 user_profile.career_data：
     * <ul>
     *   <li>JSON 数组：["计算机科学与技术"]</li>
     *   <li>JSON 对象：{"school":"深圳大学","major":"软件工程","grade":"2022级"} → ["深圳大学","软件工程","2022级"]</li>
     * </ul>
     */
    private List<String> parseCareerData(String jsonText) {
        if (jsonText == null || jsonText.isBlank()) {
            return new ArrayList<>();
        }
        try {
            JsonNode root = OBJECT_MAPPER.readTree(jsonText);
            if (root.isArray()) {
                List<String> items = new ArrayList<>();
                for (JsonNode node : root) {
                    if (node.isTextual()) {
                        items.add(node.asText());
                    } else if (node.isObject()) {
                        items.addAll(parseCareerObjectNode(node));
                    } else if (!node.isNull()) {
                        items.add(node.asText());
                    }
                }
                return items;
            }
            if (root.isObject()) {
                return parseCareerObjectNode(root);
            }
            if (root.isTextual()) {
                return List.of(root.asText());
            }
            return new ArrayList<>();
        } catch (Exception ex) {
            log.warn("user_profile career_data 解析失败: value={}, reason={}", jsonText, ex.getMessage());
            return new ArrayList<>();
        }
    }

    private List<String> parseCareerObjectNode(JsonNode object) {
        List<String> result = new ArrayList<>();
        Set<String> handled = new HashSet<>();
        for (String key : CAREER_FIELD_ORDER) {
            appendCareerField(result, handled, object, key);
        }
        object.fields().forEachRemaining(entry -> {
            if (!handled.contains(entry.getKey())) {
                appendCareerField(result, handled, object, entry.getKey());
            }
        });
        return result;
    }

    private void appendCareerField(List<String> result, Set<String> handled, JsonNode object, String key) {
        JsonNode valueNode = object.get(key);
        if (valueNode == null || valueNode.isNull()) {
            return;
        }
        String value = valueNode.asText().trim();
        if (value.isEmpty()) {
            return;
        }
        handled.add(key);
        result.add(value);
    }

    private List<String> parseJsonStringList(String jsonText) {
        if (jsonText == null || jsonText.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<String> parsed = OBJECT_MAPPER.readValue(jsonText, STRING_LIST_TYPE);
            return parsed == null ? new ArrayList<>() : parsed;
        } catch (Exception ex) {
            log.warn("user_profile JSON 字段解析失败: value={}, reason={}", jsonText, ex.getMessage());
            return new ArrayList<>();
        }
    }

    private String resolveAvatarText(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return DEFAULT_AVATAR_TEXT;
        }
        return nickname.trim().substring(0, 1);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private int normalizeLimit(Integer limit, int defaultValue) {
        if (limit == null || limit <= 0) {
            return defaultValue;
        }
        return Math.min(limit, MAX_PAGE_SIZE);
    }

    private int normalizePage(Integer page) {
        return page == null || page <= 0 ? DEFAULT_PAGE : page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private List<Project> loadProjects(String userUid, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Project> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return projectMapper.selectPage(page, baseProjectWrapper(userUid)).getRecords();
    }

    private long countProjects(String userUid) {
        return projectMapper.selectCount(baseProjectWrapper(userUid));
    }

    private LambdaQueryWrapper<Project> baseProjectWrapper(String userUid) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Project::getOwnerUid, userUid)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Note> loadNotes(String userUid, String dbContentType, int pageSize, int offset, boolean viewingOwnSpace) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Note> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return noteMapper.selectPage(page, baseNoteWrapper(userUid, dbContentType, viewingOwnSpace)).getRecords();
    }

    private long countNotes(String userUid, String dbContentType, boolean viewingOwnSpace) {
        return noteMapper.selectCount(baseNoteWrapper(userUid, dbContentType, viewingOwnSpace));
    }

    private LambdaQueryWrapper<Note> baseNoteWrapper(String userUid, String dbContentType, boolean viewingOwnSpace) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getUserUid, userUid);
        if (viewingOwnSpace) {
            // 本人视角：排除已删除，其余全部返回（DRAFT / REVIEWING / PUBLISHED / BANNED / PRIVATE / PUBLIC 均可见）
            wrapper.ne(Note::getStatus, NOTE_STATUS_DELETED);
        } else {
            // 他人视角：仅已发布且公开
            wrapper.eq(Note::getStatus, NOTE_STATUS_PUBLISHED)
                    .eq(Note::getVisibility, NOTE_VISIBILITY_PUBLIC);
        }
        if (dbContentType != null) {
            wrapper.likeRight(Note::getContentTypeCode, dbContentType);
        }
        if (viewingOwnSpace) {
            wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        } else {
            wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        }
        return wrapper;
    }

    private List<ProfileProjectItem> buildProjectItems(List<Project> projects,
                                                       UserProfile ownerProfile,
                                                       String ownerUid) {
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileProjectItem> items = new ArrayList<>();
        for (Project project : projects) {
            items.add(projectCardAssembler.toProfileProjectItem(project));
        }
        return items;
    }

    private Map<String, ProjectSecret> loadCommercialSecrets(List<String> projectUids) {
        if (projectUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<ProjectSecret> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(ProjectSecret::getProjectUid, projectUids);
        Map<String, ProjectSecret> secretMap = new HashMap<>();
        for (ProjectSecret secret : projectSecretMapper.selectList(wrapper)) {
            secretMap.put(secret.getProjectUid(), secret);
        }
        return secretMap;
    }

    private List<ProfileProjectItem.TagLabel> toProjectTagLabels(String jsonText) {
        return parseJsonStringList(jsonText).stream()
                .map(ProfileProjectItem.TagLabel::new)
                .collect(Collectors.toList());
    }

    private String resolveProjectCompany(Project project, String ownerUid) {
        if (project.getTeamUid() != null) {
            Team team = loadTeamByUid(project.getTeamUid());
            if (team != null && team.getEntityCode() != null) {
                TenantOrgProfile entityProfile = loadEntityProfileByEntityCode(team.getEntityCode());
                if (entityProfile != null && entityProfile.getName() != null && !entityProfile.getName().isBlank()) {
                    return entityProfile.getName();
                }
            }
        }
        UserOrganizationBinding authLink = loadCurrentAuthLink(ownerUid);
        UserProfile profile = loadProfile(ownerUid);
        return resolveOrganization(authLink, profile);
    }

    private TenantOrgProfile loadEntityProfileByEntityCode(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(wrapper);
    }

    private LocalDateTime resolveDisplayTime(LocalDateTime publishedAt, LocalDateTime createdAt) {
        return publishedAt != null ? publishedAt : createdAt;
    }

    private String formatProjectPublishTime(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(PROJECT_PUBLISH_DATE_FORMATTER);
    }

    private String formatProjectAmount(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        return new DecimalFormat("#,##0.##").format(amount);
    }

    private List<ProfileNoteItem> buildNoteItems(List<Note> notes) {
        List<ProfileNoteItem> items = new ArrayList<>();
        for (Note note : notes) {
            items.add(noteCardAssembler.toProfileNoteItem(note));
        }
        return items;
    }

    private String mapNoteContentTypeDisplay(String contentTypeCode) {
        if (contentTypeCode == null || contentTypeCode.isBlank()) {
            return "";
        }
        if (contentTypeCode.startsWith("TX")) {
            return "图文";
        }
        if (contentTypeCode.startsWith("VD")) {
            return "视频";
        }
        return "";
    }

    private String mapNoteContentTypeFilter(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        return switch (contentType.trim()) {
            case "图文" -> "TX";
            case "视频" -> "VD";
            default -> null;
        };
    }

    private String formatNotePublishTime(LocalDateTime publishedAt) {
        return publishedAt == null ? "" : publishedAt.format(NOTE_PUBLISH_DATETIME_FORMATTER);
    }

    private String formatNoteUpdateTime(LocalDateTime updatedAt) {
        return updatedAt == null ? "" : updatedAt.format(NOTE_UPDATE_DATE_FORMATTER);
    }

    /**
     * 从 query 参数解析目标用户 UID，兼容历史参数名。
     * 若所有参数都为空且已登录，回退到 currentUserUid。
     */
    private String resolveQueryTargetUid(String queryUid, String legacyUserUid, Long legacyUserId, String currentUserUid) {
        if (queryUid != null && !queryUid.isBlank()) {
            return queryUid.trim();
        }
        if (legacyUserUid != null && !legacyUserUid.isBlank()) {
            return legacyUserUid.trim();
        }
        if (legacyUserId != null) {
            return String.valueOf(legacyUserId);
        }
        return currentUserUid;
    }

    private boolean isSameUid(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return left.trim().equals(right.trim());
    }

    // ===================== 用户实名认证预览 =====================

    /**
     * 查询用户实名认证状态及基本资料，供团队创建时校验初始成员。
     * 未实名返回 403 USER_NOT_VERIFIED。
     */
    public UserVerifiedPreviewResponse getUserVerifiedPreview(String uid) {
        if (!StringUtils.hasText(uid)) {
            throw BusinessException.badRequest("USER_NOT_FOUND");
        }
        User user = loadUserByUid(uid.trim());
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
        UserProfile profile = loadProfile(uid.trim());

        if (!userVerificationService.isOrgBindingApproved(uid.trim())) {
            throw BusinessException.forbidden("USER_NOT_VERIFIED");
        }

        UserIdentity identity = loadIdentity(uid.trim());
        String realName = identity != null && StringUtils.hasText(identity.getRealNameMask())
                ? identity.getRealNameMask().trim() : null;
        String nickname = profile != null && StringUtils.hasText(profile.getNickName())
                ? profile.getNickName().trim() : "用户";
        String role = userVerificationService.resolveApprovedRole(uid.trim());

        return UserVerifiedPreviewResponse.builder()
                .uid(user.getUserUid())
                .realNameMask(realName)
                .nickname(nickname)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .verified(true)
                .role(role)
                .build();
    }

    // ===================== 认证状态判定 =====================
}
