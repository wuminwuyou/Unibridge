package com.unibridge.backend.domain.organization;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.domain.organization.dto.EntityMemberItem;
import com.unibridge.backend.domain.auth.EntityAdminCredentialService;
import com.unibridge.backend.domain.organization.dto.CreateLabRequest;
import com.unibridge.backend.domain.organization.dto.CreateLabResponse;
import com.unibridge.backend.domain.organization.dto.UpdateLabRequest;
import com.unibridge.backend.domain.organization.dto.AddMemberRequest;
import com.unibridge.backend.domain.organization.dto.AddMemberResponse;
import com.unibridge.backend.domain.organization.dto.UserSearchItem;
import com.unibridge.backend.domain.organization.dto.UserSearchResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileHomeResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileMenuResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileMembersResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileNotesResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileProjectsResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileSpaceResponse;
import com.unibridge.backend.domain.organization.dto.EntityProfileTeamsResponse;
import com.unibridge.backend.domain.organization.dto.EntityTeamPreviewItem;
import com.unibridge.backend.application.shared.dto.ProfileNoteItem;
import com.unibridge.backend.application.shared.dto.ProfileProjectItem;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import com.unibridge.backend.infrastructure.entities.profile.TenantOrgProfile;
import com.unibridge.backend.infrastructure.entities.note.Note;
import com.unibridge.backend.infrastructure.entities.project.Project;
import com.unibridge.backend.infrastructure.entities.team.Team;
import com.unibridge.backend.infrastructure.entities.team.TeamMember;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.auth.EntityTotpCredentials;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.TenantOrganizationMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.TenantOrgProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.note.NoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.project.ProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.EntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import com.unibridge.backend.infrastructure.util.TeamUidGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class OrganizationProfileService {

    private static final Pattern ENTITY_CODE_PATTERN = Pattern.compile("^[0-9A-Za-z]{1,32}$");
    private static final Pattern UNIVERSITY_ENTITY_CODE_PATTERN = Pattern.compile("^\\d{5}$");
    private static final Set<String> MEMBER_ROLES = Set.of("PM", "MENTOR", "COUNSELOR");
    private static final Set<String> VALID_LEVELS = Set.of("N", "R", "SR", "SSR", "UR");

    private static final String NOTE_STATUS_PUBLISHED = "PUBLISHED";
    private static final String PROJECT_STATUS_DRAFT = "DRAFT";

    private static final int DEFAULT_HOME_TEAM_LIMIT = 3;
    private static final int DEFAULT_HOME_PROJECT_LIMIT = 3;
    private static final int DEFAULT_HOME_NOTE_LIMIT = 3;
    private static final int DEFAULT_SPACE_TEAM_PREVIEW = 4;
    private static final int DEFAULT_SPACE_MEMBER_PREVIEW = 8;
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_TEAM_PAGE_SIZE = 20;
    private static final int DEFAULT_MEMBER_PAGE_SIZE = 20;
    private static final int DEFAULT_PROJECT_PAGE_SIZE = 20;
    private static final int DEFAULT_NOTE_PAGE_SIZE = 21;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MIN_ENTITY_ADMIN_COUNT = 2;
    private static final int MAX_ENTITY_ADMIN_COUNT = 3;

    @Autowired
    private EntityAdminCredentialService entityAdminCredentialService;

    @Autowired
    private TenantOrganizationMapper tenantOrganizationMapper;

    @Autowired
    private TenantOrgProfileMapper tenantOrgProfileMapper;

    @Autowired
    private TeamMapper teamMapper;

    @Autowired
    private TeamMemberMapper teamMemberMapper;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private UserIdentityMapper userIdentityMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private NoteMapper noteMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EntityTotpCredentialsMapper entityTotpCredentialsMapper;

    public EntityProfileMenuResponse getEntityProfileMenu(String entityCode) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);
        TenantOrgProfile profile = requireEntityProfile(TenantOrganization.getEntityCode());
        int boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(TenantOrganization.getEntityCode());
        return EntityProfileMenuResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .entityName(profile.getName())
                .logoUrl(profile.getLogoUrl())
                .boundAdminCount(boundAdminCount)
                .minAdminCount(MIN_ENTITY_ADMIN_COUNT)
                .maxAdminCount(MAX_ENTITY_ADMIN_COUNT)
                .entityFullyActivated(boundAdminCount >= MIN_ENTITY_ADMIN_COUNT)
                .build();
    }

    public EntityProfileSpaceResponse getEntityProfileSpace(String entityCode) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);
        TenantOrgProfile profile = requireEntityProfile(TenantOrganization.getEntityCode());
        boolean supportsLabs = supportsLabs(TenantOrganization.getEntityCode());

        long teamCount = supportsLabs ? countEntityLabs(TenantOrganization.getEntityCode()) : 0L;
        List<EntityTeamPreviewItem> teamsPreview = supportsLabs
                ? toTeamPreviewItems(loadEntityLabs(TenantOrganization.getEntityCode(), DEFAULT_SPACE_TEAM_PREVIEW, 0))
                : Collections.emptyList();
        List<EntityMemberItem> membersPreview = toMemberPreviewItems(
                loadEntityMembers(TenantOrganization.getEntityCode(), DEFAULT_SPACE_MEMBER_PREVIEW, 0));

        EntityProfileSpaceResponse.EntityCoreProfile coreProfile =
                EntityProfileSpaceResponse.EntityCoreProfile.builder()
                        .entityCode(TenantOrganization.getEntityCode())
                        .name(nullSafe(profile.getName()))
                        .intro(nullSafe(profile.getIntro()))
                        .location(nullSafe(profile.getLocation()))
                        .type(profile.getType())
                        .logoUrl(trimToNull(profile.getLogoUrl()))
                        .bannerUrl(trimToNull(profile.getBannerUrl()))
                        .teamCount(supportsLabs ? (int) teamCount : null)
                        .build();

        return EntityProfileSpaceResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .coreProfile(coreProfile)
                .extendedProfile(EntityProfileSpaceResponse.EntityExtendedProfile.builder()
                        .announcement(nullSafe(profile.getAnnouncement()))
                        .build())
                .teamsPreview(teamsPreview)
                .membersPreview(membersPreview)
                .infoRows(buildInfoRows(TenantOrganization.getEntityCode(), profile, supportsLabs, teamCount))
                .build();
    }

    public EntityProfileHomeResponse getEntityProfileHome(String entityCode,
                                                          Integer teamLimit,
                                                          Integer projectLimit,
                                                          Integer noteLimit) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);
        boolean supportsLabs = supportsLabs(TenantOrganization.getEntityCode());

        int resolvedTeamLimit = supportsLabs ? normalizeLimit(teamLimit, DEFAULT_HOME_TEAM_LIMIT) : 0;
        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_HOME_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_HOME_NOTE_LIMIT);

        List<EntityTeamPreviewItem> teams = supportsLabs
                ? toTeamPreviewItems(loadEntityLabs(TenantOrganization.getEntityCode(), resolvedTeamLimit, 0))
                : Collections.emptyList();

        return EntityProfileHomeResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .teams(teams)
                .projects(toProjectItems(loadEntityProjects(TenantOrganization.getEntityCode(), resolvedProjectLimit, 0)))
                .notes(toNoteItems(loadEntityNotes(TenantOrganization.getEntityCode(), null, resolvedNoteLimit, 0)))
                .teamTotal(supportsLabs ? countEntityLabs(TenantOrganization.getEntityCode()) : 0L)
                .projectTotal(countEntityProjects(TenantOrganization.getEntityCode()))
                .noteTotal(countEntityNotes(TenantOrganization.getEntityCode(), null))
                .build();
    }

    public EntityProfileTeamsResponse getEntityProfileTeams(String entityCode, Integer page, Integer pageSize) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);
        if (!supportsLabs(TenantOrganization.getEntityCode())) {
            return EntityProfileTeamsResponse.builder()
                    .entityCode(TenantOrganization.getEntityCode())
                    .teams(Collections.emptyList())
                    .total(0L)
                    .page(normalizePage(page))
                    .pageSize(normalizePageSize(pageSize, DEFAULT_TEAM_PAGE_SIZE))
                    .build();
        }

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_TEAM_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        long total = countEntityLabs(TenantOrganization.getEntityCode());

        return EntityProfileTeamsResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .teams(toTeamPreviewItems(loadEntityLabs(TenantOrganization.getEntityCode(), resolvedPageSize, offset)))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileMembersResponse getEntityProfileMembers(String entityCode, Integer page, Integer pageSize) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_MEMBER_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        long total = countEntityMembers(TenantOrganization.getEntityCode());
        List<UserOrganizationBinding> links = loadEntityMembers(TenantOrganization.getEntityCode(), resolvedPageSize, offset);

        return EntityProfileMembersResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .members(toMemberTabItems(links))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileProjectsResponse getEntityProfileProjects(String entityCode, Integer page, Integer pageSize) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_PROJECT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        return EntityProfileProjectsResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .projects(toProjectItems(loadEntityProjects(TenantOrganization.getEntityCode(), resolvedPageSize, offset)))
                .total(countEntityProjects(TenantOrganization.getEntityCode()))
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileNotesResponse getEntityProfileNotes(String entityCode,
                                                            Integer page,
                                                            Integer pageSize,
                                                            String contentType) {
        TenantOrganization TenantOrganization = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_NOTE_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        return EntityProfileNotesResponse.builder()
                .entityCode(TenantOrganization.getEntityCode())
                .notes(toNoteItems(loadEntityNotes(TenantOrganization.getEntityCode(), dbContentType, resolvedPageSize, offset)))
                .total(countEntityNotes(TenantOrganization.getEntityCode(), dbContentType))
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private TenantOrganization requireAccessibleEntity(String entityCode) {
        validateEntityCodeFormat(entityCode);
        TenantOrganization TenantOrganization = loadEntityByCode(entityCode.trim());
        if (TenantOrganization == null) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }
        if (!isEntityPubliclyVisible(TenantOrganization)) {
            throw BusinessException.forbidden("ENTITY_NOT_ACCESSIBLE");
        }
        return TenantOrganization;
    }

    private TenantOrgProfile requireEntityProfile(String entityCode) {
        TenantOrgProfile profile = loadEntityProfileByCode(entityCode);
        if (profile == null) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }
        return profile;
    }

    private void validateEntityCodeFormat(String entityCode) {
        if (!StringUtils.hasText(entityCode) || !ENTITY_CODE_PATTERN.matcher(entityCode.trim()).matches()) {
            throw BusinessException.badRequest("INVALID_ENTITY_CODE");
        }
    }

    private boolean supportsLabs(String entityCode) {
        return StringUtils.hasText(entityCode)
                && UNIVERSITY_ENTITY_CODE_PATTERN.matcher(entityCode.trim()).matches();
    }

    private TenantOrganization loadEntityByCode(String entityCode) {
        LambdaQueryWrapper<TenantOrganization> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrganization::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrganizationMapper.selectOne(wrapper);
    }

    private TenantOrgProfile loadEntityProfileByCode(String entityCode) {
        LambdaQueryWrapper<TenantOrgProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TenantOrgProfile::getEntityCode, entityCode).last("LIMIT 1");
        return tenantOrgProfileMapper.selectOne(wrapper);
    }

    private boolean isEntityPubliclyVisible(TenantOrganization TenantOrganization) {
        if (TenantOrganization == null) {
            return false;
        }
        if (!"ACTIVE".equalsIgnoreCase(TenantOrganization.getAccountStatus())) {
            return false;
        }
        return "APPROVED".equalsIgnoreCase(TenantOrganization.getAuditStatus());
    }

    private LambdaQueryWrapper<Team> baseEntityLabWrapper(String entityCode) {
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getEntityCode, entityCode)
                .eq(Team::getType, "LAB")
                .eq(Team::getAuditStatus, "APPROVED")
                .eq(Team::getAccountStatus, "ACTIVE")
                .last("ORDER BY created_at DESC, id DESC");
        return wrapper;
    }

    private List<Team> loadEntityLabs(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Team> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return teamMapper.selectPage(page, baseEntityLabWrapper(entityCode)).getRecords();
    }

    private long countEntityLabs(String entityCode) {
        return teamMapper.selectCount(baseEntityLabWrapper(entityCode));
    }

    private LambdaQueryWrapper<UserOrganizationBinding> baseEntityMemberWrapper(String entityCode) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getEntityCode, entityCode)
                .in(UserOrganizationBinding::getRole, MEMBER_ROLES)
                .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                .eq(UserOrganizationBinding::getIsActive, 1)
                .last("ORDER BY FIELD(role,'MENTOR','COUNSELOR','PM'), id ASC");
        return wrapper;
    }

    private List<UserOrganizationBinding> loadEntityMembers(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<UserOrganizationBinding> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return userOrganizationBindingMapper.selectPage(page, baseEntityMemberWrapper(entityCode)).getRecords();
    }

    private long countEntityMembers(String entityCode) {
        return userOrganizationBindingMapper.selectCount(baseEntityMemberWrapper(entityCode));
    }

    private LambdaQueryWrapper<Project> baseEntityProjectWrapper(String entityCode) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Project::getExtendedUid, entityCode)
                .ne(Project::getStatus, PROJECT_STATUS_DRAFT)
                .isNotNull(Project::getPublishedAt)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Project> loadEntityProjects(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Project> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return projectMapper.selectPage(page, baseEntityProjectWrapper(entityCode)).getRecords();
    }

    private long countEntityProjects(String entityCode) {
        return projectMapper.selectCount(baseEntityProjectWrapper(entityCode));
    }

    private LambdaQueryWrapper<Note> baseEntityNoteWrapper(String entityCode, String dbContentType) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getExtendedUid, entityCode)
                .eq(Note::getStatus, NOTE_STATUS_PUBLISHED);
        if (dbContentType != null) {
            wrapper.likeRight(Note::getContentTypeCode, dbContentType);
        }
        wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<Note> loadEntityNotes(String entityCode, String dbContentType, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<Note> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return noteMapper.selectPage(page, baseEntityNoteWrapper(entityCode, dbContentType)).getRecords();
    }

    private long countEntityNotes(String entityCode, String dbContentType) {
        return noteMapper.selectCount(baseEntityNoteWrapper(entityCode, dbContentType));
    }

    /**
     * 组装实验室预览项，含负责人信息。
     * <p>
     * 批量加载负责人（owner_uid）的 profile，避免 N+1 查询。
     * </p>
     */
    private List<EntityTeamPreviewItem> toTeamPreviewItems(List<Team> teams) {
        if (teams.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, Long> memberCountByTeam = loadMemberCounts(
                teams.stream().map(Team::getTeamUid).collect(Collectors.toList()));

        // 批量加载所有负责人的 profile
        Set<String> ownerUids = teams.stream()
                .map(Team::getOwnerUid)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
        List<String> ownerUidList = new ArrayList<>(ownerUids);
        Map<String, UserProfile> leaderProfileMap = ownerUids.isEmpty()
                ? Collections.emptyMap()
                : loadProfileMap(ownerUidList);
        // 批量加载负责人的实名掩码
        Map<String, UserIdentity> leaderIdentityMap = ownerUids.isEmpty()
                ? Collections.emptyMap()
                : loadIdentityMap(ownerUidList);

        List<EntityTeamPreviewItem> items = new ArrayList<>();
        for (Team team : teams) {
            String leaderUid = StringUtils.hasText(team.getOwnerUid()) ? team.getOwnerUid() : null;
            String leaderDisplayName = null;
            if (leaderUid != null) {
                UserProfile leaderProfile = leaderProfileMap.get(leaderUid);
                UserIdentity leaderIdentity = leaderIdentityMap.get(leaderUid);
                if (leaderProfile != null || leaderIdentity != null) {
                    // 优先 realNameMask（来自 t_user_identity），否则 nickname
                    leaderDisplayName = resolveDisplayName(leaderProfile, leaderIdentity);
                    // 如果回退到了默认值"用户"则置空
                    if ("用户".equals(leaderDisplayName)) {
                        leaderDisplayName = null;
                    }
                }
            }
            items.add(EntityTeamPreviewItem.builder()
                    .teamUid(team.getTeamUid())
                    .name(nullSafe(team.getTeamName()))
                    .description(nullSafe(team.getIntro()))
                    .logoUrl(trimToNull(team.getTeamLogo()))
                    .memberCount(memberCountByTeam.getOrDefault(team.getTeamUid(), 0L).intValue())
                    .leaderUid(leaderUid)
                    .leaderDisplayName(leaderDisplayName)
                    .build());
        }
        return items;
    }

    private Map<String, Long> loadMemberCounts(List<String> teamUids) {
        if (teamUids.isEmpty()) {
            return Collections.emptyMap();
        }
        LambdaQueryWrapper<TeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(TeamMember::getTeamUid, teamUids);
        Map<String, Long> counts = new HashMap<>();
        for (TeamMember member : teamMemberMapper.selectList(wrapper)) {
            counts.merge(member.getTeamUid(), 1L, Long::sum);
        }
        return counts;
    }

    /**
     * 组装人员预览项（页壳）。
     * 机构为公开场合，nickname 和 realName 均优先返回实名掩码（来自 t_user_identity）。
     */
    private List<EntityMemberItem> toMemberPreviewItems(List<UserOrganizationBinding> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> userUids = links.stream().map(UserOrganizationBinding::getUserUid).collect(Collectors.toList());
        Map<String, UserProfile> profileMap = loadProfileMap(userUids);
        Map<String, UserIdentity> identityMap = loadIdentityMap(userUids);
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserOrganizationBinding link : links) {
            UserProfile profile = profileMap.get(link.getUserUid());
            UserIdentity identity = identityMap.get(link.getUserUid());
            String displayName = resolveDisplayName(profile, identity);
            String realNameMask = identity != null ? identity.getRealNameMask() : null;
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(displayName)
                    .displayName(realNameMask)
                    .role(link.getRole())
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
    }

    /**
     * 组装成员 Tab 列表（实名掩码优先，来自 t_user_identity）。
     */
    private List<EntityMemberItem> toMemberTabItems(List<UserOrganizationBinding> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> userUids = links.stream().map(UserOrganizationBinding::getUserUid).collect(Collectors.toList());
        Map<String, UserProfile> profileMap = loadProfileMap(userUids);
        Map<String, UserIdentity> identityMap = loadIdentityMap(userUids);
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserOrganizationBinding link : links) {
            UserProfile profile = profileMap.get(link.getUserUid());
            UserIdentity identity = identityMap.get(link.getUserUid());
            String displayName = resolveDisplayName(profile, identity);
            String realNameMask = identity != null ? identity.getRealNameMask() : null;
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(displayName)
                    .displayName(realNameMask)
                    .role(link.getRole())
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
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

    private List<EntityProfileSpaceResponse.EntityInfoRow> buildInfoRows(String entityCode,
                                                                         TenantOrgProfile profile,
                                                                         boolean supportsLabs,
                                                                         long teamCount) {
        List<EntityProfileSpaceResponse.EntityInfoRow> rows = new ArrayList<>();
        rows.add(infoRow("主体代码", entityCode));
        rows.add(infoRow("所在地", nullSafe(profile.getLocation())));
        rows.add(infoRow("主体类型", formatEntityType(profile.getType())));
        if (supportsLabs) {
            rows.add(infoRow("实验室数量", teamCount + " 个"));
        }
        return rows;
    }

    private EntityProfileSpaceResponse.EntityInfoRow infoRow(String label, String value) {
        return EntityProfileSpaceResponse.EntityInfoRow.builder()
                .label(label)
                .value(value == null || value.isBlank() ? "—" : value)
                .build();
    }

    private String formatEntityType(String type) {
        if (!StringUtils.hasText(type)) {
            return "—";
        }
        return switch (type.trim().toUpperCase(Locale.ROOT)) {
            case "UNIVERSITY" -> "高校";
            case "ENTERPRISE" -> "企业";
            default -> type;
        };
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

    /**
     * 机构公开场合的展示名：优先 realNameMask（来自 t_user_identity），无则回退 nickname，最后回退"用户"。
     * real_name 已迁移至 t_user_identity 加密存储，展示侧使用掩码 realNameMask。
     */
    private String resolveDisplayName(UserProfile profile, UserIdentity identity) {
        if (identity != null && StringUtils.hasText(identity.getRealNameMask())) {
            return identity.getRealNameMask().trim();
        }
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    private String resolveLevel(UserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getLevel())) {
            return null;
        }
        String level = profile.getLevel().trim().toUpperCase(Locale.ROOT);
        return VALID_LEVELS.contains(level) ? level : null;
    }

    private int normalizeLimit(Integer limit, int defaultValue) {
        if (limit == null || limit <= 0) {
            return defaultValue;
        }
        return Math.min(limit, MAX_PAGE_SIZE);
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
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

    // ===================== 实验室 CRUD（写接口，需机构管理员鉴权） =====================

    /**
     * 创建实验室。
     * <p>
     * 【并发安全】实验室名称唯一性依赖应用层校验，数据库层面由
     * {@code uk_team_uid} 唯一索引兜底并发冲突。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public CreateLabResponse createLab(CreateLabRequest request) {
        String entityCode = normalizeEntityCode(request.getEntityCode());
        requireAccessibleEntity(entityCode);
        // 仅高校支持实验室
        assertSupportsLabs(entityCode);
        // 名称必填
        if (!StringUtils.hasText(request.getName())) {
            throw BusinessException.badRequest("TEAM_NAME_REQUIRED");
        }
        // 名称唯一性校验（同一 TenantOrganization 下）
        assertLabNameUnique(entityCode, request.getName().trim());

        Team team = new Team();
        team.setTeamUid(TeamUidGenerator.generateLab(uid -> isTeamUidUnique(uid)));
        team.setEntityCode(entityCode);
        team.setType("LAB");
        team.setTeamName(request.getName().trim());
        team.setOwnerUid(StringUtils.hasText(request.getLeaderUid()) ? request.getLeaderUid().trim() : null);
        team.setAccountStatus("ACTIVE");
        team.setAuditStatus("APPROVED");

        try {
            teamMapper.insert(team);
        } catch (DuplicateKeyException e) {
            throw BusinessException.conflict("TEAM_NAME_DUPLICATE");
        }

        // 若指定了负责人，将负责人自动添加为团队成员（MENTOR 角色）
        if (StringUtils.hasText(team.getOwnerUid())) {
            addOwnerAsTeamMember(team.getTeamUid(), team.getOwnerUid());
        }

        return CreateLabResponse.builder()
                .teamUid(team.getTeamUid())
                .name(team.getTeamName())
                .build();
    }

    /**
     * 更新实验室（名称/负责人）。
     * <p>
     * leaderUid 始终携带：有值时传 uid 字符串；清除负责人时传 null。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateLab(String teamUid, UpdateLabRequest request) {
        Team team = requireAccessibleLab(teamUid);
        boolean changed = false;

        if (StringUtils.hasText(request.getName())) {
            String newName = request.getName().trim();
            if (!newName.equals(team.getTeamName())) {
                assertLabNameUnique(team.getEntityCode(), newName);
                team.setTeamName(newName);
                changed = true;
            }
        }

        // leaderUid 始终携带：非 null 为设置负责人，null 为清除负责人
        if (request.getLeaderUid() == null) {
            // 显式清除负责人
            if (StringUtils.hasText(team.getOwnerUid())) {
                team.setOwnerUid(null);
                changed = true;
            }
        } else {
            String newLeader = request.getLeaderUid().trim();
            if (!newLeader.equals(team.getOwnerUid())) {
                if (StringUtils.hasText(newLeader)) {
                    assertUserExists(newLeader);
                    team.setOwnerUid(newLeader);
                    addOwnerAsTeamMember(teamUid, newLeader);
                } else {
                    // 空字符串也视为清除
                    team.setOwnerUid(null);
                }
                changed = true;
            }
        }

        if (changed) {
            // 使用 LambdaUpdateWrapper 显式设置所有变更字段，
            // 避免 MyBatis-Plus updateById 的 NOT_NULL 策略跳过 null 值
            LambdaUpdateWrapper<Team> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Team::getTeamUid, teamUid);
            if (StringUtils.hasText(team.getTeamName())) {
                updateWrapper.set(Team::getTeamName, team.getTeamName());
            }
            updateWrapper.set(Team::getOwnerUid, team.getOwnerUid());
            teamMapper.update(null, updateWrapper);
        }
    }

    /**
     * 删除实验室。
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteLab(String teamUid) {
        Team team = requireAccessibleLab(teamUid);
        // 级联清除团队内成员记录
        LambdaQueryWrapper<TeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(TeamMember::getTeamUid, teamUid);
        teamMemberMapper.delete(memberWrapper);
        // 按 team_uid 删除（非主键）
        LambdaQueryWrapper<Team> teamWrapper = new LambdaQueryWrapper<>();
        teamWrapper.eq(Team::getTeamUid, teamUid);
        teamMapper.delete(teamWrapper);
    }

    // ===================== 机构人员管理（写接口） =====================

    /**
     * 添加机构人员。
     * <p>
     * 主体账号主动添加用户时，直接将 audit_status 设为 APPROVED。
     * 若该用户已有同机构同角色的 user_auth_link.audit_status 记录，则升级为 APPROVED（而非重复插入）。
     * 若已存在 APPROVED 记录则拒绝重复添加。
     * 角色判定：优先沿用已有记录的角色；若无记录则默认 MENTOR。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public AddMemberResponse addMember(AddMemberRequest request) {
        String entityCode = normalizeEntityCode(request.getEntityCode());
        requireAccessibleEntity(entityCode);

        String uid = normalizeUserUid(request.getUid());
        assertUserExists(uid);

        // 先判断用户在当前 TenantOrganization 下的已有 role，再按该 role 查精确记录
        LambdaQueryWrapper<UserOrganizationBinding> roleLookupWrapper = new LambdaQueryWrapper<>();
        roleLookupWrapper.eq(UserOrganizationBinding::getEntityCode, entityCode)
                .eq(UserOrganizationBinding::getUserUid, uid)
                .orderByDesc(UserOrganizationBinding::getUpdatedAt)
                .last("LIMIT 1");
        UserOrganizationBinding anyExisting = userOrganizationBindingMapper.selectOne(roleLookupWrapper);
        // 判断角色：优先使用请求体中传来的 role，否则沿用已有记录，默认 MENTOR
        String role;
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            role = request.getRole().trim().toUpperCase(Locale.ROOT);
            if (!MEMBER_ROLES.contains(role)) {
                throw BusinessException.badRequest("INVALID_MEMBER_ROLE");
            }
        } else {
            role = (anyExisting != null && StringUtils.hasText(anyExisting.getRole()))
                    ? anyExisting.getRole().toUpperCase(Locale.ROOT)
                    : "MENTOR";
        }

        // 按 (entityCode, uid, role) 精确查找同类型记录（含 is_active=0 的历史记录）
        LambdaQueryWrapper<UserOrganizationBinding> exactWrapper = new LambdaQueryWrapper<>();
        exactWrapper.eq(UserOrganizationBinding::getEntityCode, entityCode)
                .eq(UserOrganizationBinding::getUserUid, uid)
                .eq(UserOrganizationBinding::getRole, role)
                .last("LIMIT 1");
        UserOrganizationBinding exactExisting = userOrganizationBindingMapper.selectOne(exactWrapper);

        // 已是 APPROVED 且当前活跃 → 拒绝重复添加
        if (exactExisting != null
                && "APPROVED".equalsIgnoreCase(exactExisting.getAuditStatus())
                && exactExisting.getIsActive() != null && exactExisting.getIsActive() == 1) {
            throw BusinessException.conflict("MEMBER_ALREADY_EXISTS");
        }

        if (exactExisting != null) {
            // 非 APPROVED 或 is_active=0（历史删除） →
            // 重新激活并设为 APPROVED
            exactExisting.setAuditStatus("APPROVED");
            exactExisting.setIsActive(1);
            userOrganizationBindingMapper.updateById(exactExisting);
            return AddMemberResponse.builder()
                    .uid(uid)
                    .role(role)
                    .build();
        }

        // 无记录，创建新的 APPROVED 记录
        UserOrganizationBinding link = new UserOrganizationBinding();
        link.setUserUid(uid);
        link.setEntityCode(entityCode);
        link.setRole(role);
        link.setAuditStatus("APPROVED");
        link.setIsActive(1);
        userOrganizationBindingMapper.insert(link);

        return AddMemberResponse.builder()
                .uid(uid)
                .role(role)
                .build();
    }

    /**
     * 移除机构人员。
     * <p>
     * 同时清理同用户在该机构下所有 APPROVED、PENDING、REJECTED 的 user_auth_link 记录。
     * 若要移除的记录不存在于任何状态中则返回 MEMBER_NOT_FOUND。
     * </p>
     */
    @Transactional(rollbackFor = Exception.class)
    public void removeMember(String entityCode, String uid) {
        entityCode = normalizeEntityCode(entityCode);
        requireAccessibleEntity(entityCode);

        uid = normalizeUserUid(uid);

        // 查找所有状态（含 REJECTED）的记录，一并清理
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getEntityCode, entityCode)
                .eq(UserOrganizationBinding::getUserUid, uid)
                .in(UserOrganizationBinding::getAuditStatus, "APPROVED", "PENDING", "REJECTED");
        List<UserOrganizationBinding> links = userOrganizationBindingMapper.selectList(wrapper);
        if (links.isEmpty()) {
            throw BusinessException.notFound("MEMBER_NOT_FOUND");
        }

        for (UserOrganizationBinding link : links) {
            link.setIsActive(0);
            userOrganizationBindingMapper.updateById(link);
        }
    }

    // ===================== 用户搜索 =====================

    /**
     * 模糊搜索用户（按 uid / nickname 前缀或包含匹配）。
     * <p>
     * 注意：real_name 已迁移至 t_user_identity 加密存储，无法按明文模糊搜索，已从搜索条件中移除。
     * 搜索结果中的 realName 字段使用 t_user_identity.real_name_mask 填充。
     * </p>
     * <p>
     * 【权限控制】通过 Authorization 头中的 CLIENT_ORG token 提取 entity_code，
     * 仅返回该机构下 {@code user_auth_link.audit_status = 'APPROVED'} 的用户，
     * 禁止非本机构用户担任实验室负责人。
     * </p>
     */
    public UserSearchResponse searchUsers(String authorization, String keyword) {
        if (!StringUtils.hasText(keyword) || keyword.trim().length() < 1) {
            return UserSearchResponse.builder().users(List.of()).build();
        }

        // 从 token 提取主体代码
        String entityCode = extractEntityCodeFromToken(authorization);
        if (!StringUtils.hasText(entityCode)) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        // 查询该机构下所有已审核且活跃用户的 user_auth_link
        LambdaQueryWrapper<UserOrganizationBinding> authWrapper = new LambdaQueryWrapper<>();
        authWrapper.eq(UserOrganizationBinding::getEntityCode, entityCode)
                .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                .eq(UserOrganizationBinding::getIsActive, 1)
                .select(UserOrganizationBinding::getUserUid);
        List<String> entityUserUids = userOrganizationBindingMapper.selectList(authWrapper).stream()
                .map(UserOrganizationBinding::getUserUid)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());

        if (entityUserUids.isEmpty()) {
            return UserSearchResponse.builder().users(List.of()).build();
        }

        String kw = keyword.trim();

        // 在 profile 中模糊搜索，并限制 user_uid 属于该机构
        // NOTE: real_name has been removed from user_profile table and moved to t_user_identity (encrypted),
        // plaintext fuzzy search on real_name is no longer possible.
        LambdaQueryWrapper<UserProfile> profileWrapper = new LambdaQueryWrapper<>();
        profileWrapper.in(UserProfile::getUserUid, entityUserUids)
                .and(w -> w
                        .like(UserProfile::getUserUid, kw)
                        .or()
                        .like(UserProfile::getNickName, kw))
                .last("LIMIT 20");
        List<UserProfile> profiles = userProfileMapper.selectList(profileWrapper);

        // 批量加载实名掩码用于填充 realName 字段
        List<String> profileUserUids = profiles.stream()
                .map(UserProfile::getUserUid)
                .collect(Collectors.toList());
        Map<String, UserIdentity> identityMap = loadIdentityMap(profileUserUids);

        List<UserSearchItem> users = profiles.stream()
                .map(p -> {
                    UserIdentity identity = identityMap.get(p.getUserUid());
                    return UserSearchItem.builder()
                            .uid(p.getUserUid())
                            .nickname(StringUtils.hasText(p.getNickName()) ? p.getNickName() : "用户")
                            .displayName(identity != null && StringUtils.hasText(identity.getRealNameMask())
                                    ? identity.getRealNameMask() : null)
                            .avatarUrl(p.getAvatarUrl())
                            .build();
                })
                .collect(Collectors.toList());

        return UserSearchResponse.builder().users(users).build();
    }

    // ===================== 私有辅助方法 =====================

    private Team requireAccessibleLab(String teamUid) {
        if (!StringUtils.hasText(teamUid)) {
            throw BusinessException.notFound("TEAM_NOT_FOUND");
        }
        // 按 team_uid 查询（非主键 id），使用 LambdaQueryWrapper
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getTeamUid, teamUid.trim()).last("LIMIT 1");
        Team team = teamMapper.selectOne(wrapper);
        if (team == null || !"LAB".equalsIgnoreCase(team.getType())) {
            throw BusinessException.notFound("TEAM_NOT_FOUND");
        }
        if (!"ACTIVE".equalsIgnoreCase(team.getAccountStatus())) {
            throw BusinessException.forbidden("TEAM_NOT_ACCESSIBLE");
        }
        return team;
    }

    private boolean isTeamUidUnique(String teamUid) {
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getTeamUid, teamUid);
        return teamMapper.selectCount(wrapper) == 0;
    }

    private void assertSupportsLabs(String entityCode) {
        if (!supportsLabs(entityCode)) {
            throw BusinessException.badRequest("LABS_NOT_SUPPORTED");
        }
    }

    private void assertLabNameUnique(String entityCode, String name) {
        LambdaQueryWrapper<Team> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Team::getEntityCode, entityCode)
                .eq(Team::getType, "LAB")
                .eq(Team::getTeamName, name)
                .last("LIMIT 1");
        if (teamMapper.selectOne(wrapper) != null) {
            throw BusinessException.conflict("TEAM_NAME_DUPLICATE");
        }
    }

    private void assertUserExists(String userUid) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUserUid, userUid).last("LIMIT 1");
        if (userMapper.selectOne(wrapper) == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
    }

    private void addOwnerAsTeamMember(String teamUid, String ownerUid) {
        // 若已存在 team_member 记录则跳过
        LambdaQueryWrapper<TeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TeamMember::getTeamUid, teamUid)
                .eq(TeamMember::getUserUid, ownerUid)
                .last("LIMIT 1");
        if (teamMemberMapper.selectOne(wrapper) != null) {
            return;
        }
        TeamMember member = new TeamMember();
        member.setTeamUid(teamUid);
        member.setUserUid(ownerUid);
        member.setRole("MENTOR");
        member.setIsAdmin(1);
        member.setInvitedByUid(null);
        try {
            teamMemberMapper.insert(member);
        } catch (DuplicateKeyException e) {
            // 并发创建时忽略
        }
    }

    private String normalizeEntityCode(String entityCode) {
        if (!StringUtils.hasText(entityCode)) {
            throw BusinessException.badRequest("ENTITY_NOT_FOUND");
        }
        return entityCode.trim();
    }

    private String normalizeUserUid(String uid) {
        if (!StringUtils.hasText(uid)) {
            throw BusinessException.badRequest("USER_NOT_FOUND");
        }
        return uid.trim();
    }

    /**
     * 从 Authorization 头提取 CLIENT_ORG token 对应的 entity_code。
     * CLIENT_ORG token 的 userId/server 字段即为 entityCode 或 adminUid，
     * entityCode（非 EA 开头的 adminUid）作为主体代码。
     * 同时支持主体根账号和管理员账号的 token。
     */
    private String extractEntityCodeFromToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        try {
            String userType = jwtUtil.getUserType(token);
            if (!"CLIENT_ORG".equals(userType)) {
                return null;
            }
            // CLIENT_ORG token 的 userId 是 entityCode（主体登录）或 adminUid（管理员登录）
            // adminUid 格式为 EA + 11 位，entityCode 为纯数字/字母
            String subject = jwtUtil.getUserId(token);
            if (subject == null || subject.isBlank()) {
                return null;
            }
            subject = subject.trim();
            // 若 subject 是 adminUid（EA 开头），需要通过 sys_entity_totp_credentials 反查 entityCode
            if (subject.matches("^EA[A-Za-z0-9]{11}$")) {
                return lookupEntityCodeByAdminUid(subject);
            }
            // 否则 subject 就是 entityCode（主体根账号登录）
            return subject;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 通过管理员 uid 反查所属主体代码。
     */
    private String lookupEntityCodeByAdminUid(String adminUid) {
        LambdaQueryWrapper<EntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EntityTotpCredentials::getAdminUid, adminUid)
                .last("LIMIT 1");
        EntityTotpCredentials admin = entityTotpCredentialsMapper.selectOne(wrapper);
        return admin != null ? admin.getEntityCode() : null;
    }
}
