package com.unibridge.backend.domain.space;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.domain.space.dto.ProfileNoteItem;
import com.unibridge.backend.domain.space.dto.ProfileProjectItem;
import com.unibridge.backend.domain.space.dto.TeamAchievementItem;
import com.unibridge.backend.domain.space.dto.TeamMemberItem;
import com.unibridge.backend.domain.space.dto.TeamProfileAchievementsResponse;
import com.unibridge.backend.domain.space.dto.TeamProfileHomeResponse;
import com.unibridge.backend.domain.space.dto.TeamProfileMembersResponse;
import com.unibridge.backend.domain.space.dto.TeamProfileNotesResponse;
import com.unibridge.backend.domain.space.dto.TeamProfileProjectsResponse;
import com.unibridge.backend.domain.space.dto.TeamProfileSpaceResponse;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.AchievementArchive;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.ClientProject;
import com.unibridge.backend.infrastructure.entities.ClientTeam;
import com.unibridge.backend.infrastructure.entities.ClientTeamMember;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.AchievementArchiveMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
public class TeamSpaceService {

    private static final Pattern TEAM_UID_PATTERN = Pattern.compile("^(LB|ST)[A-Za-z0-9]{11}$");
    private static final Set<String> VALID_LEVELS = Set.of("N", "R", "SR", "SSR", "UR");
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
            "UR", 5,
            "SSR", 4,
            "SR", 3,
            "R", 2,
            "N", 1
    );

    private static final Map<String, Integer> MEMBER_TAB_ROLE_ORDER = Map.of(
            "LEADER", 0,
            "MENTOR", 1,
            "MEMBER", 2
    );

    @Autowired
    private ClientTeamMapper clientTeamMapper;

    @Autowired
    private ClientTeamMemberMapper clientTeamMemberMapper;

    @Autowired
    private ClientUserProfileMapper clientUserProfileMapper;

    @Autowired
    private ClientEntityProfileMapper clientEntityProfileMapper;

    @Autowired
    private ClientProjectMapper clientProjectMapper;

    @Autowired
    private ClientNoteMapper clientNoteMapper;

    @Autowired
    private AchievementArchiveMapper achievementArchiveMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    public TeamProfileSpaceResponse getTeamProfileSpace(String teamUid) {
        ClientTeam team = requireAccessibleTeam(teamUid);
        List<ClientTeamMember> memberships = loadTeamMemberships(teamUid);
        String organizationName = resolveOrganizationName(team);
        String researchDirection = formatResearchDirection(team.getTag());
        int memberCount = memberships.size();

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

        List<TeamMemberItem> members = buildMemberItems(team, sortMembersForSpacePreview(team, memberships));

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
        ClientTeam team = requireAccessibleTeam(teamUid);
        List<String> memberUids = loadTeamMemberUids(team);

        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_HOME_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_HOME_NOTE_LIMIT);
        int resolvedAchievementLimit = normalizeLimit(achievementLimit, DEFAULT_HOME_ACHIEVEMENT_LIMIT);

        List<ClientProject> projects = loadTeamProjects(teamUid, resolvedProjectLimit, 0);
        List<ClientNote> notes = loadTeamNotes(memberUids, null, resolvedNoteLimit, 0);
        List<AchievementArchive> achievements = loadTeamAchievements(memberUids, resolvedAchievementLimit, 0);

        return TeamProfileHomeResponse.builder()
                .teamUid(team.getTeamUid())
                .projects(toProjectItems(projects))
                .notes(toNoteItems(notes))
                .achievements(toAchievementItems(achievements))
                .projectTotal(countTeamProjects(teamUid))
                .noteTotal(countTeamNotes(memberUids, null))
                .achievementTotal(countTeamAchievements(memberUids))
                .build();
    }

    public TeamProfileMembersResponse getTeamProfileMembers(String teamUid, Integer page, Integer pageSize) {
        ClientTeam team = requireAccessibleTeam(teamUid);
        List<ClientTeamMember> memberships = loadTeamMemberships(teamUid);
        List<ClientTeamMember> sorted = sortMembersForTab(memberships);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_MEMBER_PAGE_SIZE);
        long total = sorted.size();
        int fromIndex = Math.min((resolvedPage - 1) * resolvedPageSize, sorted.size());
        int toIndex = Math.min(fromIndex + resolvedPageSize, sorted.size());
        List<ClientTeamMember> pageSlice = sorted.subList(fromIndex, toIndex);

        return TeamProfileMembersResponse.builder()
                .teamUid(team.getTeamUid())
                .members(buildMemberItems(team, pageSlice))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public TeamProfileProjectsResponse getTeamProfileProjects(String teamUid, Integer page, Integer pageSize) {
        ClientTeam team = requireAccessibleTeam(teamUid);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_PROJECT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        List<ClientProject> projects = loadTeamProjects(teamUid, resolvedPageSize, offset);
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
        ClientTeam team = requireAccessibleTeam(teamUid);
        List<String> memberUids = loadTeamMemberUids(team);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_NOTE_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        List<ClientNote> notes = loadTeamNotes(memberUids, dbContentType, resolvedPageSize, offset);
        long total = countTeamNotes(memberUids, dbContentType);

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
        ClientTeam team = requireAccessibleTeam(teamUid);
        List<String> memberUids = loadTeamMemberUids(team);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_ACHIEVEMENT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        List<AchievementArchive> achievements = loadTeamAchievements(memberUids, resolvedPageSize, offset);
        long total = countTeamAchievements(memberUids);

        return TeamProfileAchievementsResponse.builder()
                .teamUid(team.getTeamUid())
                .achievements(toAchievementItems(achievements))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private ClientTeam requireAccessibleTeam(String teamUid) {
        validateTeamUidFormat(teamUid);
        ClientTeam team = loadTeamByUid(teamUid);
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

    private ClientTeam loadTeamByUid(String teamUid) {
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getTeamUid, teamUid.trim()).last("LIMIT 1");
        return clientTeamMapper.selectOne(wrapper);
    }

    /** LAB 须 audit_status=APPROVED；团队 account_status 须 ACTIVE。 */
    private boolean isTeamPubliclyVisible(ClientTeam team) {
        if (team == null || !"ACTIVE".equalsIgnoreCase(team.getAccountStatus())) {
            return false;
        }
        if ("LAB".equalsIgnoreCase(team.getType())) {
            return "APPROVED".equalsIgnoreCase(team.getAuditStatus());
        }
        return true;
    }

    private List<ClientTeamMember> loadTeamMemberships(String teamUid) {
        LambdaQueryWrapper<ClientTeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeamMember::getTeamUid, teamUid);
        return clientTeamMemberMapper.selectList(wrapper);
    }

    private List<String> loadTeamMemberUids(ClientTeam team) {
        Set<String> uids = new HashSet<>();
        for (ClientTeamMember membership : loadTeamMemberships(team.getTeamUid())) {
            if (StringUtils.hasText(membership.getUserUid())) {
                uids.add(membership.getUserUid());
            }
        }
        if (StringUtils.hasText(team.getOwnerUid())) {
            uids.add(team.getOwnerUid());
        }
        return new ArrayList<>(uids);
    }

    private String resolveOrganizationName(ClientTeam team) {
        if (!StringUtils.hasText(team.getEntityCode())) {
            return null;
        }
        ClientEntityProfile entityProfile = loadEntityProfileByEntityCode(team.getEntityCode());
        if (entityProfile == null || !StringUtils.hasText(entityProfile.getName())) {
            return null;
        }
        return entityProfile.getName();
    }

    private ClientEntityProfile loadEntityProfileByEntityCode(String entityCode) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityProfileMapper.selectOne(wrapper);
    }

    private String formatResearchDirection(String tagJson) {
        List<String> tags = parseJsonStringList(tagJson);
        if (tags.isEmpty()) {
            return "";
        }
        return String.join(" · ", tags);
    }

    private List<TeamProfileSpaceResponse.TeamInfoRow> buildInfoRows(ClientTeam team,
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

    private List<TeamMemberItem> buildMemberItems(ClientTeam team, List<ClientTeamMember> orderedSlice) {
        if (orderedSlice.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                orderedSlice.stream().map(ClientTeamMember::getUserUid).collect(Collectors.toList()));
        List<TeamMemberItem> items = new ArrayList<>();
        for (ClientTeamMember membership : orderedSlice) {
            ClientUserProfile profile = profileMap.get(membership.getUserUid());
            items.add(TeamMemberItem.builder()
                    .uid(membership.getUserUid())
                    .nickname(resolveNickname(profile))
                    .role(resolveMemberRoleDisplay(team, membership))
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
    }

    /**
     * 主页成员预览排序：owner → 导师 → 学生/成员；同层按等级降序，再按 joined_at 升序。
     */
    private List<ClientTeamMember> sortMembersForSpacePreview(ClientTeam team, List<ClientTeamMember> memberships) {
        if (memberships.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                memberships.stream().map(ClientTeamMember::getUserUid).collect(Collectors.toList()));
        return memberships.stream()
                .sorted(Comparator
                        .comparingInt((ClientTeamMember member) -> spacePreviewTier(team, member))
                        .thenComparing((ClientTeamMember member) ->
                                levelOrder(profileMap.get(member.getUserUid())), Comparator.reverseOrder())
                        .thenComparing(member -> member.getJoinedAt() == null
                                ? LocalDateTime.MAX
                                : member.getJoinedAt()))
                .collect(Collectors.toList());
    }

    /** 成员 Tab 排序：LEADER → MENTOR → MEMBER，同角色 joined_at 升序。 */
    private List<ClientTeamMember> sortMembersForTab(List<ClientTeamMember> memberships) {
        return memberships.stream()
                .sorted(Comparator
                        .comparingInt((ClientTeamMember member) -> memberTabRoleOrder(member.getRole()))
                        .thenComparing(member -> member.getJoinedAt() == null
                                ? LocalDateTime.MAX
                                : member.getJoinedAt()))
                .collect(Collectors.toList());
    }

    private int spacePreviewTier(ClientTeam team, ClientTeamMember member) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(member.getUserUid())) {
            return 0;
        }
        if ("MENTOR".equalsIgnoreCase(member.getRole())) {
            return 1;
        }
        return 2;
    }

    private int memberTabRoleOrder(String role) {
        if (!StringUtils.hasText(role)) {
            return 99;
        }
        return MEMBER_TAB_ROLE_ORDER.getOrDefault(role.toUpperCase(Locale.ROOT), 99);
    }

    private int levelOrder(ClientUserProfile profile) {
        String level = resolveLevel(profile);
        if (level == null) {
            return 0;
        }
        return LEVEL_ORDER.getOrDefault(level, 0);
    }

    private String resolveMemberRoleDisplay(ClientTeam team, ClientTeamMember member) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(member.getUserUid())) {
            return "LAB".equalsIgnoreCase(team.getType()) ? "负责人" : "队长";
        }
        return mapTeamMemberRole(member.getRole());
    }

    private String mapTeamMemberRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "";
        }
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "LEADER" -> "队长";
            case "MENTOR" -> "导师";
            case "MEMBER" -> "成员";
            default -> role;
        };
    }

    private Map<String, ClientUserProfile> loadProfileMap(List<String> userUids) {
        if (userUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(ClientUserProfile::getUserUid, userUids);
        Map<String, ClientUserProfile> profileMap = new HashMap<>();
        for (ClientUserProfile profile : clientUserProfileMapper.selectList(wrapper)) {
            profileMap.put(profile.getUserUid(), profile);
        }
        return profileMap;
    }

    private String resolveNickname(ClientUserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getNickName())) {
            return "用户";
        }
        return profile.getNickName().trim();
    }

    private String resolveLevel(ClientUserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getLevel())) {
            return null;
        }
        String level = profile.getLevel().trim().toUpperCase(Locale.ROOT);
        return VALID_LEVELS.contains(level) ? level : null;
    }

    private LambdaQueryWrapper<ClientProject> baseTeamProjectWrapper(String teamUid) {
        LambdaQueryWrapper<ClientProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientProject::getTeamUid, teamUid)
                .ne(ClientProject::getStatus, PROJECT_STATUS_DRAFT)
                .isNotNull(ClientProject::getPublishedAt)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ClientProject> loadTeamProjects(String teamUid, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientProject> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientProjectMapper.selectPage(page, baseTeamProjectWrapper(teamUid)).getRecords();
    }

    private long countTeamProjects(String teamUid) {
        return clientProjectMapper.selectCount(baseTeamProjectWrapper(teamUid));
    }

    private LambdaQueryWrapper<ClientNote> baseTeamNoteWrapper(List<String> memberUids, String dbContentType) {
        LambdaQueryWrapper<ClientNote> wrapper = new LambdaQueryWrapper<>();
        if (memberUids.isEmpty()) {
            wrapper.eq(ClientNote::getUserUid, "__NONE__");
        } else {
            wrapper.in(ClientNote::getUserUid, memberUids);
        }
        wrapper.eq(ClientNote::getStatus, NOTE_STATUS_PUBLISHED);
        if (dbContentType != null) {
            wrapper.likeRight(ClientNote::getContentTypeCode, dbContentType);
        }
        wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ClientNote> loadTeamNotes(List<String> memberUids, String dbContentType, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientNote> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientNoteMapper.selectPage(page, baseTeamNoteWrapper(memberUids, dbContentType)).getRecords();
    }

    private long countTeamNotes(List<String> memberUids, String dbContentType) {
        return clientNoteMapper.selectCount(baseTeamNoteWrapper(memberUids, dbContentType));
    }

    private LambdaQueryWrapper<AchievementArchive> baseTeamAchievementWrapper(List<String> memberUids) {
        LambdaQueryWrapper<AchievementArchive> wrapper = new LambdaQueryWrapper<>();
        if (memberUids.isEmpty()) {
            wrapper.eq(AchievementArchive::getUserUid, "__NONE__");
        } else {
            wrapper.in(AchievementArchive::getUserUid, memberUids);
        }
        wrapper.last("ORDER BY COALESCE(completed_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<AchievementArchive> loadTeamAchievements(List<String> memberUids, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<AchievementArchive> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return achievementArchiveMapper.selectPage(page, baseTeamAchievementWrapper(memberUids)).getRecords();
    }

    private long countTeamAchievements(List<String> memberUids) {
        return achievementArchiveMapper.selectCount(baseTeamAchievementWrapper(memberUids));
    }

    private List<ProfileProjectItem> toProjectItems(List<ClientProject> projects) {
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileProjectItem> items = new ArrayList<>();
        for (ClientProject project : projects) {
            items.add(projectCardAssembler.toProfileProjectItem(project));
        }
        return items;
    }

    private List<ProfileNoteItem> toNoteItems(List<ClientNote> notes) {
        if (notes.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProfileNoteItem> items = new ArrayList<>();
        for (ClientNote note : notes) {
            items.add(noteCardAssembler.toProfileNoteItem(note));
        }
        return items;
    }

    private List<TeamAchievementItem> toAchievementItems(List<AchievementArchive> archives) {
        if (archives.isEmpty()) {
            return Collections.emptyList();
        }
        List<TeamAchievementItem> items = new ArrayList<>();
        for (AchievementArchive archive : archives) {
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
}
