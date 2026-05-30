package com.unibridge.backend.domain.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.domain.user.dto.ProfileHomeResponse;
import com.unibridge.backend.application.shared.dto.ProfileNoteItem;
import com.unibridge.backend.domain.user.dto.ProfileNotesResponse;
import com.unibridge.backend.application.shared.dto.ProfileProjectItem;
import com.unibridge.backend.domain.user.dto.ProfileProjectsResponse;
import com.unibridge.backend.domain.user.dto.ProfileMenuResponse;
import com.unibridge.backend.domain.user.dto.ProfileSpaceResponse;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.ClientProject;
import com.unibridge.backend.infrastructure.entities.ClientProjectCommercialSecret;
import com.unibridge.backend.infrastructure.entities.ClientTeam;
import com.unibridge.backend.infrastructure.entities.ClientTeamMember;
import com.unibridge.backend.infrastructure.entities.ClientUser;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectCommercialSecretMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
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
    private ClientUserMapper clientUserMapper;

    @Autowired
    private ClientUserProfileMapper clientUserProfileMapper;

    @Autowired
    private UserAuthLinkMapper userAuthLinkMapper;

    @Autowired
    private ClientTeamMapper clientTeamMapper;

    @Autowired
    private ClientTeamMemberMapper clientTeamMemberMapper;

    @Autowired
    private ClientEntityProfileMapper clientEntityProfileMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    @Autowired
    private ClientProjectMapper clientProjectMapper;

    @Autowired
    private ClientProjectCommercialSecretMapper clientProjectCommercialSecretMapper;

    @Autowired
    private ClientNoteMapper clientNoteMapper;

    /** UserProfileMenu 顶部菜单初始化数据。 */
    public ProfileMenuResponse getProfileMenu(String authorization) {
        String userUid = accessService.requireCurrentUserUid(authorization);

        ClientUser user = loadUserByUid(userUid);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        ClientUserProfile profile = loadProfile(userUid);
        return new ProfileMenuResponse(
                userUid,
                nullSafe(profile == null ? null : profile.getNickName()),
                nullSafe(profile == null ? null : profile.getLevel()),
                nullSafe(profile == null ? null : profile.getAvatarUrl()),
                nullSafe(profile == null ? null : profile.getCurrentEntityName())
        );
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

        ClientUser user = loadUserByUid(targetUserUid);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        ClientUserProfile profile = loadProfile(targetUserUid);
        UserAuthLink currentAuthLink = loadCurrentAuthLink(targetUserUid);
        ProfileSpaceResponse.BaseInfo baseInfo = buildBaseInfo(profile, currentAuthLink);
        ProfileSpaceResponse.ExtendInfo extendInfo = buildExtendInfo(user, profile, currentAuthLink, request);
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
        String currentUserUid = accessService.resolveOptionalCurrentUserUid(authorization);
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId, currentUserUid);
        if (targetUserUid == null) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        assertUserExists(targetUserUid);

        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_NOTE_LIMIT);

        ClientUserProfile profile = loadProfile(targetUserUid);
        List<ClientProject> projects = loadProjects(targetUserUid, resolvedProjectLimit, 0);
        List<ClientNote> notes = loadNotes(targetUserUid, null, resolvedNoteLimit, 0);

        return ProfileHomeResponse.builder()
                .uid(targetUserUid)
                .viewingOwnSpace(isSameUid(currentUserUid, targetUserUid))
                .projects(buildProjectItems(projects, profile, targetUserUid))
                .notes(buildNoteItems(notes))
                .projectTotal(countProjects(targetUserUid))
                .noteTotal(countNotes(targetUserUid, null))
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

        ClientUserProfile profile = loadProfile(targetUserUid);
        List<ClientProject> projects = loadProjects(targetUserUid, resolvedPageSize, offset);
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
        String targetUserUid = resolveQueryTargetUid(queryUid, legacyUserUid, legacyUserId,
                accessService.resolveOptionalCurrentUserUid(authorization));
        if (targetUserUid == null) {
            throw BusinessException.badRequest("USER_UID_REQUIRED");
        }
        assertUserExists(targetUserUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        List<ClientNote> notes = loadNotes(targetUserUid, dbContentType, resolvedPageSize, offset);
        long total = countNotes(targetUserUid, dbContentType);

        return ProfileNotesResponse.builder()
                .userUid(targetUserUid)
                .notes(buildNoteItems(notes))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private ProfileSpaceResponse.BaseInfo buildBaseInfo(ClientUserProfile profile, UserAuthLink currentAuthLink) {
        String nickname = nullSafe(profile == null ? null : profile.getNickName());
        String avatarUrl = nullSafe(profile == null ? null : profile.getAvatarUrl());
        String bio = nullSafe(profile == null ? null : profile.getIntro());
        String level = nullSafe(profile == null ? null : profile.getLevel());

        // position：user_auth_link.role（当前活跃身份 is_active=1，含 PENDING 待审核）
        String position = mapAuthRoleToPosition(currentAuthLink == null ? null : currentAuthLink.getRole());
        String organization = resolveOrganization(currentAuthLink, profile);
        String verifyStatus = resolveVerifyStatus(profile, currentAuthLink);

        return ProfileSpaceResponse.BaseInfo.builder()
                .nickname(nickname)
                .avatarText(resolveAvatarText(nickname))
                .avatarUrl(avatarUrl)
                .isVerified(!verifyStatus.isEmpty())
                .organization(organization)
                .position(position)
                .bio(bio)
                .level(level)
                .build();
    }

    /**
     * 通过 user_auth_link.entity_code 关联 entity_profile.name 获取所属主体名称。
     * 无有效认证记录时回退 user_profile.current_entity_name。
     */
    private String resolveOrganization(UserAuthLink authLink, ClientUserProfile profile) {
        if (authLink != null && authLink.getEntityCode() != null) {
            LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ClientEntityProfile::getEntityCode, authLink.getEntityCode()).last("LIMIT 1");
            ClientEntityProfile entityProfile = clientEntityProfileMapper.selectOne(wrapper);
            if (entityProfile != null && entityProfile.getName() != null && !entityProfile.getName().isBlank()) {
                return entityProfile.getName();
            }
        }
        return nullSafe(profile == null ? null : profile.getCurrentEntityName());
    }

    private ProfileSpaceResponse.ExtendInfo buildExtendInfo(ClientUser user,
                                                            ClientUserProfile profile,
                                                            UserAuthLink authLink,
                                                            HttpServletRequest request) {
        return ProfileSpaceResponse.ExtendInfo.builder()
                .notice(nullSafe(profile == null ? null : profile.getAnnouncement()))
                .verifyStatus(resolveVerifyStatus(profile, authLink))
                .ipLocation(resolveIpLocation(request))
                .joinDate(formatJoinDate(user.getCreatedAt()))
                .careerData(parseCareerData(profile == null ? null : profile.getCareerData()))
                .skills(parseJsonStringList(profile == null ? null : profile.getBioData()))
                .build();
    }

    /**
     * 实名/认证状态判定：
     * <ul>
     *   <li>机构认证：user_auth_link.audit_status=APPROVED 且 is_active=1</li>
     *   <li>已实名：user_profile.real_name 非空（含毕业/退出机构 is_active=0 时的回退）</li>
     * </ul>
     */
    private String resolveVerifyStatus(ClientUserProfile profile, UserAuthLink authLink) {
        if (isOrgAuthVerified(authLink)) {
            String role = authLink.getRole();
            if (role != null && "PM".equalsIgnoreCase(role)) {
                return "企业已认证";
            }
            return "学校已认证";
        }
        if (isRealNameVerified(profile)) {
            return "已实名";
        }
        return "";
    }

    /** 已实名：user_profile.real_name 非空。 */
    private boolean isRealNameVerified(ClientUserProfile profile) {
        return profile != null
                && profile.getRealName() != null
                && !profile.getRealName().isBlank();
    }

    /** 机构认证通过：user_auth_link.audit_status=APPROVED 且 is_active=1。 */
    private boolean isOrgAuthVerified(UserAuthLink authLink) {
        return authLink != null
                && "APPROVED".equalsIgnoreCase(authLink.getAuditStatus())
                && authLink.getIsActive() != null
                && authLink.getIsActive() == 1;
    }

    private ClientUserProfile loadProfile(String userUid) {
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserUid, userUid).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    private UserAuthLink loadCurrentAuthLink(String userUid) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserUid, userUid)
                .eq(UserAuthLink::getIsActive, 1)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        return userAuthLinkMapper.selectOne(wrapper);
    }

    private List<ProfileSpaceResponse.AssociatedTeam> loadAssociatedTeams(String userUid) {
        Map<String, ClientTeam> teamMap = new LinkedHashMap<>();

        LambdaQueryWrapper<ClientTeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(ClientTeamMember::getUserUid, userUid);
        for (ClientTeamMember membership : clientTeamMemberMapper.selectList(memberWrapper)) {
            ClientTeam team = loadTeamByUid(membership.getTeamUid());
            if (team != null && team.getTeamUid() != null && !team.getTeamUid().isBlank()) {
                teamMap.putIfAbsent(team.getTeamUid(), team);
            }
        }

        LambdaQueryWrapper<ClientTeam> ownerWrapper = new LambdaQueryWrapper<>();
        ownerWrapper.eq(ClientTeam::getOwnerUid, userUid);
        for (ClientTeam team : clientTeamMapper.selectList(ownerWrapper)) {
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
    private int compareAssociatedTeamOrder(ClientTeam left, ClientTeam right) {
        boolean leftLab = "LAB".equalsIgnoreCase(left.getType());
        boolean rightLab = "LAB".equalsIgnoreCase(right.getType());
        if (leftLab != rightLab) {
            return leftLab ? -1 : 1;
        }
        return nullSafe(left.getTeamName()).compareTo(nullSafe(right.getTeamName()));
    }

    private ProfileSpaceResponse.AssociatedTeam toAssociatedTeamItem(ClientTeam team) {
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
            case "STUDENT" -> "学生";
            default -> role;
        };
    }

    private void assertUserExists(String userUid) {
        if (loadUserByUid(userUid) == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
    }

    private ClientUser loadUserByUid(String userUid) {
        LambdaQueryWrapper<ClientUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUser::getUserUid, userUid).last("LIMIT 1");
        return clientUserMapper.selectOne(wrapper);
    }

    private ClientTeam loadTeamByUid(String teamUid) {
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getTeamUid, teamUid).last("LIMIT 1");
        return clientTeamMapper.selectOne(wrapper);
    }

    /** 团队对外可见：account_status=ACTIVE；LAB 还须 audit_status=APPROVED。 */
    private boolean isTeamPubliclyVisible(ClientTeam team) {
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

    private List<ClientProject> loadProjects(String userUid, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientProject> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientProjectMapper.selectPage(page, baseProjectWrapper(userUid)).getRecords();
    }

    private long countProjects(String userUid) {
        return clientProjectMapper.selectCount(baseProjectWrapper(userUid));
    }

    private LambdaQueryWrapper<ClientProject> baseProjectWrapper(String userUid) {
        LambdaQueryWrapper<ClientProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientProject::getOwnerUid, userUid)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ClientNote> loadNotes(String userUid, String dbContentType, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientNote> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientNoteMapper.selectPage(page, baseNoteWrapper(userUid, dbContentType)).getRecords();
    }

    private long countNotes(String userUid, String dbContentType) {
        return clientNoteMapper.selectCount(baseNoteWrapper(userUid, dbContentType));
    }

    private LambdaQueryWrapper<ClientNote> baseNoteWrapper(String userUid, String dbContentType) {
        LambdaQueryWrapper<ClientNote> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientNote::getUserUid, userUid)
                .eq(ClientNote::getStatus, NOTE_STATUS_PUBLISHED);
        if (dbContentType != null) {
            wrapper.likeRight(ClientNote::getContentTypeCode, dbContentType);
        }
        wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ProfileProjectItem> buildProjectItems(List<ClientProject> projects,
                                                       ClientUserProfile ownerProfile,
                                                       String ownerUid) {
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileProjectItem> items = new ArrayList<>();
        for (ClientProject project : projects) {
            items.add(projectCardAssembler.toProfileProjectItem(project));
        }
        return items;
    }

    private Map<String, ClientProjectCommercialSecret> loadCommercialSecrets(List<String> projectUids) {
        if (projectUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<ClientProjectCommercialSecret> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(ClientProjectCommercialSecret::getProjectUid, projectUids);
        Map<String, ClientProjectCommercialSecret> secretMap = new HashMap<>();
        for (ClientProjectCommercialSecret secret : clientProjectCommercialSecretMapper.selectList(wrapper)) {
            secretMap.put(secret.getProjectUid(), secret);
        }
        return secretMap;
    }

    private List<ProfileProjectItem.TagLabel> toProjectTagLabels(String jsonText) {
        return parseJsonStringList(jsonText).stream()
                .map(ProfileProjectItem.TagLabel::new)
                .collect(Collectors.toList());
    }

    private String resolveProjectCompany(ClientProject project, String ownerUid) {
        if (project.getTeamUid() != null) {
            ClientTeam team = loadTeamByUid(project.getTeamUid());
            if (team != null && team.getEntityCode() != null) {
                ClientEntityProfile entityProfile = loadEntityProfileByEntityCode(team.getEntityCode());
                if (entityProfile != null && entityProfile.getName() != null && !entityProfile.getName().isBlank()) {
                    return entityProfile.getName();
                }
            }
        }
        UserAuthLink authLink = loadCurrentAuthLink(ownerUid);
        ClientUserProfile profile = loadProfile(ownerUid);
        return resolveOrganization(authLink, profile);
    }

    private ClientEntityProfile loadEntityProfileByEntityCode(String entityCode) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityProfileMapper.selectOne(wrapper);
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

    private List<ProfileNoteItem> buildNoteItems(List<ClientNote> notes) {
        List<ProfileNoteItem> items = new ArrayList<>();
        for (ClientNote note : notes) {
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
}
