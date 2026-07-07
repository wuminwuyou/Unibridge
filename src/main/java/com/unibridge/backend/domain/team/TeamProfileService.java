package com.unibridge.backend.domain.team;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.application.shared.dto.ProfileNoteItem;
import com.unibridge.backend.application.shared.dto.ProfileProjectItem;
import com.unibridge.backend.domain.team.dto.TeamAchievementItem;
import com.unibridge.backend.domain.team.dto.TeamMemberItem;
import com.unibridge.backend.domain.team.dto.CreateStudentTeamRequest;
import com.unibridge.backend.domain.team.dto.CreateStudentTeamResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileAchievementsResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileHomeResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileMembersResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileNotesResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileProjectsResponse;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.team.dto.SyncTeamMembersRequest;
import com.unibridge.backend.domain.team.dto.SyncTeamMembersResponse;
import com.unibridge.backend.domain.team.dto.TeamProfileSpaceResponse;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.domain.user.dto.UserPublicPreviewResponse;
import com.unibridge.backend.infrastructure.entities.interaction.Achievement;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.team.Team;
import com.unibridge.backend.infrastructure.entities.team.TeamMember;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.interaction.AchievementMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.util.TeamUidGenerator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class TeamProfileService {

    private static final Pattern TEAM_UID_PATTERN = Pattern.compile("^(LB|ST)[A-Za-z0-9]{11}$");
    private static final Pattern USER_UID_PATTERN = Pattern.compile("^US[A-Za-z0-9]{11}$");
    private static final Set<String> ADDITION_ROLES = Set.of("MENTOR", "MEMBER");
    private static final Set<String> VALID_LEVELS = Set.of("S", "A", "B", "C", "D", "E");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter ACHIEVEMENT_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";
    private static final String PROJECT_STATUS_DRAFT = "DRAFT";

    private static final int DEFAULT_HOME_PROJECT_LIMIT = 3;
    private static final int DEFAULT_HOME_NOTE_LIMIT = 3;
    private static final int DEFAULT_HOME_ACHIEVEMENT_LIMIT = 3;
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PROJECT_PAGE_SIZE = 20;
    private static final int DEFAULT_NOTE_PAGE_SIZE = 21;
    private static final int DEFAULT_ACHIEVEMENT_PAGE_SIZE = 20;
    private static final int DEFAULT_MEMBER_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private static final Map<String, Integer> LEVEL_ORDER = Map.of(
            "S", 6,
            "A", 5,
            "B", 4,
            "C", 3,
            "D", 2,
            "E", 1
    );

    @Autowired
    private TeamMapper teamMapper;

    @Autowired
    private TeamMemberMapper teamMemberMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private TenantOrgProfileMapper tenantOrgProfileMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private NoteMapper noteMapper;

    @Autowired
    private AchievementMapper achievementMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    @Autowired
    private AccessService accessService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private UserIdentityMapper userIdentityMapper;

    public TeamProfileSpaceResponse getTeamProfileSpace(String authorization, String teamUid) {
        Team team = requireAccessibleTeam(teamUid);
        List<TeamMember> memberships = loadTeamMemberships(teamUid);
        String organizationName = resolveOrganizationName(team);
        String researchDirection = formatResearchDirection(team.getTag());
        int memberCount = memberships.size();
        boolean showRealName = isViewerTeamMember(team, resolveOptionalViewerUid(authorization));

        TeamProfileSpaceResponse.TeamCoreProfile coreProfile = TeamProfileSpaceResponse.TeamCoreProfile.builder()
                .teamUid(team.getTeamUid())
                .name(nullSafe(team.getTeamName()))
                .description(nullSafe(team.getIntro()))
                .organizationName(organizationName)
                .logoUrl(trimToNull(team.getTeamLogo()))
                .memberCount(memberCount)
                .foundedAt(formatDate(team.getCreatedAt()))
                .build();

        TeamProfileSpaceResponse.TeamExtendedProfile extendedProfile =
                TeamProfileSpaceResponse.TeamExtendedProfile.builder()
                        .notice(nullSafe(team.getAnnouncement()))
                        .researchDirection(researchDirection)
                        .contactEmail(trimToNull(team.getContactEmail()))
                        .build();

        List<TeamMemberItem> members = buildMemberItems(team, sortMembersForDisplay(team, memberships), showRealName);

        return TeamProfileSpaceResponse.builder()
                .teamUid(team.getTeamUid())
                .coreProfile(coreProfile)
                .extendedProfile(extendedProfile)
                .members(members)
                .infoRows(buildInfoRows(team, organizationName, researchDirection, memberCount))
                .build();
    }

    public TeamProfileHomeResponse getTeamProfileHome(String teamUid,
                                                      Integer projectLimit,
                                                      Integer noteLimit,
                                                      Integer achievementLimit) {
        Team team = requireAccessibleTeam(teamUid);
        List<String> memberUids = loadTeamMemberUids(team);

        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_HOME_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_HOME_NOTE_LIMIT);
        int resolvedAchievementLimit = normalizeLimit(achievementLimit, DEFAULT_HOME_ACHIEVEMENT_LIMIT);

        List<Project> projects = loadTeamProjects(teamUid, resolvedProjectLimit, 0);
        List<Note> notes = loadTeamNotes(teamUid, null, resolvedNoteLimit, 0);
        List<Achievement> achievements = loadTeamAchievements(memberUids, resolvedAchievementLimit, 0);

        return TeamProfileHomeResponse.builder()
                .teamUid(team.getTeamUid())
                .projects(toProjectItems(projects))
                .notes(toNoteItems(notes))
                .achievements(toAchievementItems(achievements))
                .projectTotal(countTeamProjects(teamUid))
                .noteTotal(countTeamNotes(teamUid, null))
                .achievementTotal(countTeamAchievements(memberUids))
                .build();
    }

    public TeamProfileMembersResponse getTeamProfileMembers(String authorization,
                                                            String teamUid,
                                                            Integer page,
                                                            Integer pageSize) {
        Team team = requireAccessibleTeam(teamUid);
        boolean showRealName = isViewerTeamMember(team, resolveOptionalViewerUid(authorization));
        List<TeamMember> memberships = loadTeamMemberships(teamUid);
        List<TeamMember> sorted = sortMembersForDisplay(team, memberships);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_MEMBER_PAGE_SIZE);
        long total = sorted.size();
        int fromIndex = Math.min((resolvedPage - 1) * resolvedPageSize, sorted.size());
        int toIndex = Math.min(fromIndex + resolvedPageSize, sorted.size());
        List<TeamMember> pageSlice = sorted.subList(fromIndex, toIndex);

        return TeamProfileMembersResponse.builder()
                .teamUid(team.getTeamUid())
                .members(buildMemberItems(team, pageSlice, showRealName))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public TeamProfileProjectsResponse getTeamProfileProjects(String teamUid, Integer page, Integer pageSize) {
        Team team = requireAccessibleTeam(teamUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_PROJECT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        List<Project> projects = loadTeamProjects(teamUid, resolvedPageSize, offset);
        long total = countTeamProjects(teamUid);

        return TeamProfileProjectsResponse.builder()
                .teamUid(team.getTeamUid())
                .projects(toProjectItems(projects))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public TeamProfileNotesResponse getTeamProfileNotes(String teamUid,
                                                        Integer page,
                                                        Integer pageSize,
                                                        String contentType) {
        Team team = requireAccessibleTeam(teamUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_NOTE_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        List<Note> notes = loadTeamNotes(teamUid, dbContentType, resolvedPageSize, offset);
        long total = countTeamNotes(teamUid, dbContentType);

        return TeamProfileNotesResponse.builder()
                .teamUid(team.getTeamUid())
                .notes(toNoteItems(notes))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public TeamProfileAchievementsResponse getTeamProfileAchievements(String teamUid,
                                                                      Integer page,
                                                                      Integer pageSize) {
        Team team = requireAccessibleTeam(teamUid);
        List<String> memberUids = loadTeamMemberUids(team);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_ACHIEVEMENT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        List<Achievement> achievements = loadTeamAchievements(memberUids, resolvedPageSize, offset);
        long total = countTeamAchievements(memberUids);

        return TeamProfileAchievementsResponse.builder()
                .teamUid(team.getTeamUid())
                .achievements(toAchievementItems(achievements))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private Team requireAccessibleTeam(String teamUid) {
        validateTeamUidFormat(teamUid);
        Team team = loadTeamByUid(teamUid);
        if (team == null) {
            throw BusinessException.notFound("TEAM_NOT_FOUND");
        }
        if (!isTeamPubliclyVisible(team)) {
            throw BusinessException.forbidden("TEAM_NOT_ACCESSIBLE");
        }
        return team;
    }

    private void validateTeamUidFormat(String teamUid) {
        if (!StringUtils.hasText(teamUid) || !TEAM_UID_PATTERN.matcher(teamUid.trim()).matches()) {
            throw BusinessException.badRequest("INVALID_TEAM_UID");
        }
    }

    private Team loadTeamByUid(String teamUid) {
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getTeamUid, teamUid.trim()).last("LIMIT 1");
        return teamMapper.selectOne(wrapper);
    }

    /** LAB 须 audit_status=APPROVED；团队 account_status 须 ACTIVE。 */
    private boolean isTeamPubliclyVisible(Team team) {
        if (team == null || !"ACTIVE".equalsIgnoreCase(team.getAccountStatus())) {
            return false;
        }
        if ("LAB".equalsIgnoreCase(team.getType())) {
            return "APPROVED".equalsIgnoreCase(team.getAuditStatus());
        }
        return true;
    }

    private List<TeamMember> loadTeamMemberships(String teamUid) {
        LambdaQueryWrapper<TeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMember::getTeamUid, teamUid);
        return teamMemberMapper.selectList(wrapper);
    }

    private List<String> loadTeamMemberUids(Team team) {
        Set<String> uids = new HashSet<>();
        for (TeamMember membership : loadTeamMemberships(team.getTeamUid())) {
            if (StringUtils.hasText(membership.getUserUid())) {
                uids.add(membership.getUserUid());
            }
        }
        if (StringUtils.hasText(team.getOwnerUid())) {
            uids.add(team.getOwnerUid());
        }
        return new ArrayList<>(uids);
    }

    private String resolveOrganizationName(Team team) {
        if (!StringUtils.hasText(team.getEntityCode())) {
            return null;
        }
        TenantOrgProfile entityProfile = loadEntityProfileByEntityCode(team.getEntityCode());
        if (entityProfile == null || !StringUtils.hasText(entityProfile.getName())) {
            return null;
        }
        return entityProfile.getName();
    }

    private TenantOrgProfile loadEntityProfileByEntityCode(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(wrapper);
    }

    private String formatResearchDirection(String tagJson) {
        List<String> tags = parseJsonStringList(tagJson);
        if (tags.isEmpty()) {
            return "";
        }
        return String.join(" · ", tags);
    }

    private List<TeamProfileSpaceResponse.TeamInfoRow> buildInfoRows(Team team,
                                                                     String organizationName,
                                                                     String researchDirection,
                                                                     int memberCount) {
        List<TeamProfileSpaceResponse.TeamInfoRow> rows = new ArrayList<>();
        rows.add(infoRow("团队 UID", team.getTeamUid()));
        rows.add(infoRow("所属主体", organizationName == null ? "—" : organizationName));
        rows.add(infoRow("加入时间", formatDate(team.getCreatedAt())));
        rows.add(infoRow("成员规模", memberCount + " 人"));
        rows.add(infoRow("研究方向", researchDirection.isBlank() ? "—" : researchDirection));
        String contactEmail = trimToNull(team.getContactEmail());
        rows.add(infoRow("联系邮箱", contactEmail == null ? "—" : contactEmail));
        return rows;
    }

    private TeamProfileSpaceResponse.TeamInfoRow infoRow(String label, String value) {
        return TeamProfileSpaceResponse.TeamInfoRow.builder()
                .label(label)
                .value(value)
                .build();
    }

    private List<TeamMemberItem> buildMemberItems(Team team,
                                                List<TeamMember> orderedSlice,
                                                boolean showRealName) {
        if (orderedSlice.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> uids = orderedSlice.stream().map(TeamMember::getUserUid).collect(Collectors.toList());
        Map<String, UserProfile> profileMap = loadProfileMap(uids);
        Map<String, UserIdentity> identityMap = loadIdentityMap(uids);
        List<TeamMemberItem> items = new ArrayList<>();
        for (TeamMember membership : orderedSlice) {
            UserProfile profile = profileMap.get(membership.getUserUid());
            UserIdentity identity = identityMap.get(membership.getUserUid());
            items.add(TeamMemberItem.builder()
                    .uid(membership.getUserUid())
                    .nickname(resolveMemberDisplayName(profile, showRealName, identity))
                    .role(resolveMemberRole(membership))
                    .career(trimToNull(membership.getCareer()))
                    .isAdmin(resolveIsAdmin(team, membership))
                    .isOwner(resolveIsOwner(team, membership))
                    .invitedByUid(resolveInvitedByUid(team, membership))
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
    }

    /** 负责人 → 导师 → 学生/成员；同层按等级降序，再按 joined_at 升序。 */
    private List<TeamMember> sortMembersForDisplay(Team team, List<TeamMember> memberships) {
        if (memberships.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, UserProfile> profileMap = loadProfileMap(
                memberships.stream().map(TeamMember::getUserUid).collect(Collectors.toList()));
        return memberships.stream()
                .sorted(Comparator
                        .comparingInt((TeamMember member) -> spacePreviewTier(team, member))
                        .thenComparing((TeamMember member) ->
                                levelOrder(profileMap.get(member.getUserUid())), Comparator.reverseOrder())
                        .thenComparing(member -> member.getJoinedAt() == null
                                ? LocalDateTime.MAX
                                : member.getJoinedAt()))
                .collect(Collectors.toList());
    }

    private int spacePreviewTier(Team team, TeamMember member) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(member.getUserUid())) {
            return 0;
        }
        if ("MENTOR".equalsIgnoreCase(member.getRole())) {
            return 1;
        }
        return 2;
    }

    private int levelOrder(UserProfile profile) {
        String level = resolveLevel(profile);
        if (level == null) {
            return 0;
        }
        return LEVEL_ORDER.getOrDefault(level, 0);
    }

    private String resolveMemberRole(TeamMember member) {
        if (!StringUtils.hasText(member.getRole())) {
            return "MEMBER";
        }
        return member.getRole().trim().toUpperCase(Locale.ROOT);
    }

    private boolean resolveIsOwner(Team team, TeamMember member) {
        return StringUtils.hasText(team.getOwnerUid())
                && team.getOwnerUid().equals(member.getUserUid());
    }

    /** is_admin=1 或 team.owner_uid 匹配时视为管理员。 */
    private boolean resolveIsAdmin(Team team, TeamMember member) {
        if (member.getIsAdmin() != null && member.getIsAdmin() == 1) {
            return true;
        }
        return StringUtils.hasText(team.getOwnerUid())
                && team.getOwnerUid().equals(member.getUserUid());
    }

    /** owner 入驻无邀请人；其余取 team_member.invited_by_uid。 */
    private String resolveInvitedByUid(Team team, TeamMember member) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(member.getUserUid())) {
            return null;
        }
        return trimToNull(member.getInvitedByUid());
    }

    private Map<String, UserProfile> loadProfileMap(List<String> userUids) {
        if (userUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(UserProfile::getUserUid, userUids);
        Map<String, UserProfile> profileMap = new HashMap<>();
        for (UserProfile profile : userProfileMapper.selectList(wrapper)) {
            profileMap.put(profile.getUserUid(), profile);
        }
        return profileMap;
    }

    private Map<String, UserIdentity> loadIdentityMap(List<String> userUids) {
        if (userUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<UserIdentity> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(UserIdentity::getUserUid, userUids);
        Map<String, UserIdentity> identityMap = new HashMap<>();
        for (UserIdentity identity : userIdentityMapper.selectList(wrapper)) {
            identityMap.put(identity.getUserUid(), identity);
        }
        return identityMap;
    }

    private UserProfile loadProfile(String userUid) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(wrapper);
    }

    private String resolveNickname(UserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getNickName())) {
            return "用户";
        }
        return profile.getNickName().trim();
    }

    /** 管理成员场景：优先 real_name，否则回退 nickname。 */
    private String resolveRealNameOrNickname(UserProfile profile, UserIdentity identity) {
        if (identity != null && StringUtils.hasText(identity.getRealNameMask())) {
            return identity.getRealNameMask().trim();
        }
        return resolveNickname(profile);
    }

    /**
     * members[].nickname 展示名：团队成员查看时填 real_name，否则填 nickname。
     */
    private String resolveMemberDisplayName(UserProfile profile, boolean showRealName, UserIdentity identity) {
        if (showRealName) {
            return resolveRealNameOrNickname(profile, identity);
        }
        return resolveNickname(profile);
    }

    private String resolveOptionalViewerUid(String authorization) {
        return accessService.resolveOptionalCurrentUserUid(authorization);
    }

    /** 当前登录用户是否为该团队成员（含 owner_uid）。 */
    private boolean isViewerTeamMember(Team team, String viewerUid) {
        if (!StringUtils.hasText(viewerUid)) {
            return false;
        }
        if (isOwnerUid(team, viewerUid)) {
            return true;
        }
        return findMembership(team.getTeamUid(), viewerUid) != null;
    }

    private String resolveLevel(UserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getLevel())) {
            return null;
        }
        String level = profile.getLevel().trim().toUpperCase(Locale.ROOT);
        return VALID_LEVELS.contains(level) ? level : null;
    }

    private LambdaQueryWrapper<Project> baseTeamProjectWrapper(String teamUid) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Project::getTeamUid, teamUid)
                .ne(Project::getStatus, PROJECT_STATUS_DRAFT)
                .isNotNull(Project::getPublishedAt)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Project> loadTeamProjects(String teamUid, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Project> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return projectMapper.selectPage(page, baseTeamProjectWrapper(teamUid)).getRecords();
    }

    private long countTeamProjects(String teamUid) {
        return projectMapper.selectCount(baseTeamProjectWrapper(teamUid));
    }

    private LambdaQueryWrapper<Note> baseTeamNoteWrapper(String teamUid, String dbContentType) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        // 按 notes.extended_uid = teamUid 查询团队关联笔记，非按作者 user_uid
        wrapper.eq(Note::getExtendedUid, teamUid)
                .eq(Note::getStatus, NOTE_STATUS_PUBLISHED);
        if (dbContentType != null) {
            wrapper.likeRight(Note::getContentTypeCode, dbContentType);
        }
        wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Note> loadTeamNotes(String teamUid, String dbContentType, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Note> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return noteMapper.selectPage(page, baseTeamNoteWrapper(teamUid, dbContentType)).getRecords();
    }

    private long countTeamNotes(String teamUid, String dbContentType) {
        return noteMapper.selectCount(baseTeamNoteWrapper(teamUid, dbContentType));
    }

    private LambdaQueryWrapper<Achievement> baseTeamAchievementWrapper(List<String> memberUids) {
        LambdaQueryWrapper<Achievement> wrapper = new LambdaQueryWrapper<>();
        if (memberUids.isEmpty()) {
            wrapper.eq(Achievement::getUserUid, "__NONE__");
        } else {
            wrapper.in(Achievement::getUserUid, memberUids);
        }
        wrapper.last("ORDER BY COALESCE(completed_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Achievement> loadTeamAchievements(List<String> memberUids, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Achievement> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return achievementMapper.selectPage(page, baseTeamAchievementWrapper(memberUids)).getRecords();
    }

    private long countTeamAchievements(List<String> memberUids) {
        return achievementMapper.selectCount(baseTeamAchievementWrapper(memberUids));
    }

    private List<ProfileProjectItem> toProjectItems(List<Project> projects) {
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileProjectItem> items = new ArrayList<>();
        for (Project project : projects) {
            items.add(projectCardAssembler.toProfileProjectItem(project));
        }
        return items;
    }

    private List<ProfileNoteItem> toNoteItems(List<Note> notes) {
        if (notes.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileNoteItem> items = new ArrayList<>();
        for (Note note : notes) {
            items.add(noteCardAssembler.toProfileNoteItem(note));
        }
        return items;
    }

    private List<TeamAchievementItem> toAchievementItems(List<Achievement> archives) {
        if (archives.isEmpty()) {
            return Collections.emptyList();
        }
        List<TeamAchievementItem> items = new ArrayList<>();
        for (Achievement archive : archives) {
            items.add(TeamAchievementItem.builder()
                    .achievementUid(archive.getAchievementUid())
                    .maskedProjectName(nullSafe(archive.getMaskedProjectName()))
                    .taskDescription(nullSafe(archive.getTaskDescription()))
                    .technicalTags(parseJsonStringList(archive.getTechnicalTags()))
                    .completedAt(formatAchievementDate(archive.getCompletedAt()))
                    .build());
        }
        return items;
    }

    private String mapNoteContentTypeFilter(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return null;
        }
        return switch (contentType.trim()) {
            case "图文" -> "TX";
            case "视频" -> "VD";
            default -> null;
        };
    }

    private List<String> parseJsonStringList(String jsonText) {
        if (!StringUtils.hasText(jsonText)) {
            return new ArrayList<>();
        }
        try {
            List<String> parsed = OBJECT_MAPPER.readValue(jsonText, STRING_LIST_TYPE);
            return parsed == null ? new ArrayList<>() : parsed;
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(DATE_FORMATTER);
    }

    private String formatAchievementDate(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(ACHIEVEMENT_DATE_FORMATTER);
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

    private int normalizePageSize(Integer pageSize, int defaultValue) {
        if (pageSize == null || pageSize <= 0) {
            return defaultValue;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private void requireTeamAdmin(Team team, String currentUserUid) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(currentUserUid)) {
            return;
        }
        TeamMember membership = findMembership(team.getTeamUid(), currentUserUid);
        if (membership == null || !resolveIsAdmin(team, membership)) {
            throw BusinessException.forbidden("TEAM_MEMBER_FORBIDDEN");
        }
    }

    private TeamMember findMembership(String teamUid, String userUid) {
        LambdaQueryWrapper<TeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMember::getTeamUid, teamUid)
                .eq(TeamMember::getUserUid, userUid)
                .last("LIMIT 1");
        return teamMemberMapper.selectOne(wrapper);
    }

    private Map<String, TeamMember> loadMemberMap(String teamUid) {
        Map<String, TeamMember> map = new HashMap<>();
        for (TeamMember member : loadTeamMemberships(teamUid)) {
            map.put(member.getUserUid(), member);
        }
        return map;
    }

    private List<SyncTeamMembersRequest.MemberUpdate> normalizeUpdates(SyncTeamMembersRequest request) {
        if (request == null || request.getUpdates() == null) {
            return Collections.emptyList();
        }
        return request.getUpdates();
    }

    private List<SyncTeamMembersRequest.MemberAddition> normalizeAdditions(SyncTeamMembersRequest request) {
        if (request == null || request.getAdditions() == null) {
            return Collections.emptyList();
        }
        return request.getAdditions();
    }

    private List<SyncTeamMembersRequest.MemberRemoval> normalizeRemovals(SyncTeamMembersRequest request) {
        if (request == null || request.getRemovals() == null) {
            return Collections.emptyList();
        }
        return request.getRemovals();
    }

    private void validateRemovals(Team team,
                                  List<SyncTeamMembersRequest.MemberRemoval> removals,
                                  Map<String, TeamMember> memberByUid) {
        if (removals.isEmpty()) {
            return;
        }
        Set<String> removalUids = new HashSet<>();
        for (SyncTeamMembersRequest.MemberRemoval removal : removals) {
            removalUids.add(normalizeRequiredUserUid(removal.getUid()));
        }
        if (memberByUid.size() - removalUids.size() < 1) {
            throw BusinessException.badRequest("TEAM_MEMBER_LAST_ONE");
        }
        for (String uid : removalUids) {
            if (isOwnerUid(team, uid)) {
                throw BusinessException.badRequest("TEAM_MEMBER_OWNER_IMMUTABLE");
            }
            if (!memberByUid.containsKey(uid)) {
                throw BusinessException.notFound("TEAM_MEMBER_NOT_FOUND");
            }
        }
    }

    private void validateUpdates(Team team,
                                 List<SyncTeamMembersRequest.MemberUpdate> updates,
                                 Map<String, TeamMember> memberByUid) {
        for (SyncTeamMembersRequest.MemberUpdate update : updates) {
            String uid = normalizeRequiredUserUid(update.getUid());
            if (!memberByUid.containsKey(uid)) {
                throw BusinessException.notFound("TEAM_MEMBER_NOT_FOUND");
            }
            requireNonEmptyCareer(update.getCareer());
            assertUserExists(uid);
        }
    }

    private void validateAdditions(Team team,
                                   List<SyncTeamMembersRequest.MemberAddition> additions,
                                   Map<String, TeamMember> memberByUid) {
        for (SyncTeamMembersRequest.MemberAddition addition : additions) {
            String uid = normalizeRequiredUserUid(addition.getUid());
            if (memberByUid.containsKey(uid)) {
                throw BusinessException.conflict("TEAM_MEMBER_ALREADY_EXISTS");
            }
            assertUserExists(uid);
            String role = normalizeAdditionRole(addition.getRole());
            requireNonEmptyCareer(addition.getCareer());
            if ("LAB".equalsIgnoreCase(team.getType()) && "MEMBER".equals(role)) {
                assertLabMembershipAvailable(uid);
            }
        }
    }

    private void applyRemovals(List<SyncTeamMembersRequest.MemberRemoval> removals,
                               Map<String, TeamMember> memberByUid) {
        for (SyncTeamMembersRequest.MemberRemoval removal : removals) {
            String uid = removal.getUid().trim();
            TeamMember member = memberByUid.get(uid);
            if (member != null) {
                teamMemberMapper.deleteById(member.getId());
                memberByUid.remove(uid);
            }
        }
    }

    /**
     * 应用成员更新（仅更新目标字段，避免全字段覆盖）。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新 career 和 is_admin 字段，
     * 防止并发的不同字段更新操作互相覆盖。
     * </p>
     */
    private void applyUpdates(Team team,
                              List<SyncTeamMembersRequest.MemberUpdate> updates,
                              Map<String, TeamMember> memberByUid) {
        for (SyncTeamMembersRequest.MemberUpdate update : updates) {
            String uid = update.getUid().trim();
            TeamMember member = memberByUid.get(uid);
            if (member == null) {
                continue;
            }
            LambdaUpdateWrapper<TeamMember> wrapper = new LambdaUpdateWrapper<>();
            wrapper.eq(TeamMember::getId, member.getId());
            wrapper.set(TeamMember::getCareer, update.getCareer().trim());
            if (isOwnerUid(team, uid)) {
                wrapper.set(TeamMember::getIsAdmin, 1);
            } else if (update.getIsAdmin() != null) {
                wrapper.set(TeamMember::getIsAdmin, Boolean.TRUE.equals(update.getIsAdmin()) ? 1 : 0);
            }
            teamMemberMapper.update(null, wrapper);
        }
    }

    private void applyAdditions(Team team,
                                List<SyncTeamMembersRequest.MemberAddition> additions,
                                Map<String, TeamMember> memberByUid,
                                String invitedByUid) {
        for (SyncTeamMembersRequest.MemberAddition addition : additions) {
            String uid = addition.getUid().trim();
            String role = normalizeAdditionRole(addition.getRole());
            TeamMember member = new TeamMember();
            member.setTeamUid(team.getTeamUid());
            member.setUserUid(uid);
            member.setRole(role);
            member.setCareer(addition.getCareer().trim());
            member.setIsAdmin(0);
            member.setInvitedByUid(invitedByUid);
            if ("LAB".equalsIgnoreCase(team.getType()) && "MEMBER".equals(role)) {
                member.setLabUserUid(uid);
            }
            try {
                teamMemberMapper.insert(member);
            } catch (DuplicateKeyException ex) {
                throw BusinessException.conflict("TEAM_MEMBER_LAB_CONFLICT");
            }
            memberByUid.put(uid, member);
        }
    }

    private void assertUserExists(String userUid) {
        if (loadUserByUid(userUid) == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
    }

    private void assertLabMembershipAvailable(String userUid) {
        LambdaQueryWrapper<TeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMember::getLabUserUid, userUid);
        if (teamMemberMapper.selectCount(wrapper) > 0) {
            throw BusinessException.conflict("TEAM_MEMBER_LAB_CONFLICT");
        }
    }

    private User loadUserByUid(String userUid) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUserUid, userUid).last("LIMIT 1");
        return userMapper.selectOne(wrapper);
    }

    private void validateUserUidFormat(String uid) {
        if (!StringUtils.hasText(uid) || !USER_UID_PATTERN.matcher(uid.trim()).matches()) {
            throw BusinessException.badRequest("INVALID_USER_UID");
        }
    }

    private String normalizeRequiredUserUid(String uid) {
        validateUserUidFormat(uid);
        return uid.trim();
    }

    private String normalizeAdditionRole(String role) {
        if (!StringUtils.hasText(role)) {
            throw BusinessException.badRequest("TEAM_MEMBER_CAREER_REQUIRED");
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!ADDITION_ROLES.contains(normalized)) {
            throw BusinessException.badRequest("INVALID_MEMBER_ROLE");
        }
        return normalized;
    }

    private void requireNonEmptyCareer(String career) {
        if (!StringUtils.hasText(career) || career.trim().isEmpty()) {
            throw BusinessException.badRequest("TEAM_MEMBER_CAREER_REQUIRED");
        }
    }

    private boolean isOwnerUid(Team team, String userUid) {
        return StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(userUid);
    }
}
