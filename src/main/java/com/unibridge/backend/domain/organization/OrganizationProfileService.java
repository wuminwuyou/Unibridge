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
import com.unibridge.backend.infrastructure.entities.ClientEntity;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.ClientProject;
import com.unibridge.backend.infrastructure.entities.ClientTeam;
import com.unibridge.backend.infrastructure.entities.ClientTeamMember;
import com.unibridge.backend.infrastructure.entities.ClientUser;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.entities.SysEntityTotpCredentials;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.SysEntityTotpCredentialsMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
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
    private ClientEntityMapper clientEntityMapper;

    @Autowired
    private ClientEntityProfileMapper clientEntityProfileMapper;

    @Autowired
    private ClientTeamMapper clientTeamMapper;

    @Autowired
    private ClientTeamMemberMapper clientTeamMemberMapper;

    @Autowired
    private UserAuthLinkMapper userAuthLinkMapper;

    @Autowired
    private ClientUserProfileMapper clientUserProfileMapper;

    @Autowired
    private ClientProjectMapper clientProjectMapper;

    @Autowired
    private ClientNoteMapper clientNoteMapper;

    @Autowired
    private ProjectCardAssembler projectCardAssembler;

    @Autowired
    private NoteCardAssembler noteCardAssembler;

    @Autowired
    private ClientUserMapper clientUserMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SysEntityTotpCredentialsMapper sysEntityTotpCredentialsMapper;

    public EntityProfileMenuResponse getEntityProfileMenu(String entityCode) {
        ClientEntity entity = requireAccessibleEntity(entityCode);
        ClientEntityProfile profile = requireEntityProfile(entity.getEntityCode());
        int boundAdminCount = entityAdminCredentialService.countBoundEntityAdmins(entity.getEntityCode());
        return EntityProfileMenuResponse.builder()
                .entityCode(entity.getEntityCode())
                .entityName(profile.getName())
                .logoUrl(profile.getLogoUrl())
                .boundAdminCount(boundAdminCount)
                .minAdminCount(MIN_ENTITY_ADMIN_COUNT)
                .maxAdminCount(MAX_ENTITY_ADMIN_COUNT)
                .entityFullyActivated(boundAdminCount >= MIN_ENTITY_ADMIN_COUNT)
                .build();
    }

    public EntityProfileSpaceResponse getEntityProfileSpace(String entityCode) {
        ClientEntity entity = requireAccessibleEntity(entityCode);
        ClientEntityProfile profile = requireEntityProfile(entity.getEntityCode());
        boolean supportsLabs = supportsLabs(entity.getEntityCode());

        long teamCount = supportsLabs ? countEntityLabs(entity.getEntityCode()) : 0L;
        List<EntityTeamPreviewItem> teamsPreview = supportsLabs
                ? toTeamPreviewItems(loadEntityLabs(entity.getEntityCode(), DEFAULT_SPACE_TEAM_PREVIEW, 0))
                : Collections.emptyList();
        List<EntityMemberItem> membersPreview = toMemberPreviewItems(
                loadEntityMembers(entity.getEntityCode(), DEFAULT_SPACE_MEMBER_PREVIEW, 0));

        EntityProfileSpaceResponse.EntityCoreProfile coreProfile =
                EntityProfileSpaceResponse.EntityCoreProfile.builder()
                        .entityCode(entity.getEntityCode())
                        .name(nullSafe(profile.getName()))
                        .intro(nullSafe(profile.getIntro()))
                        .location(nullSafe(profile.getLocation()))
                        .type(profile.getType())
                        .logoUrl(trimToNull(profile.getLogoUrl()))
                        .bannerUrl(trimToNull(profile.getBannerUrl()))
                        .teamCount(supportsLabs ? (int) teamCount : null)
                        .build();

        return EntityProfileSpaceResponse.builder()
                .entityCode(entity.getEntityCode())
                .coreProfile(coreProfile)
                .extendedProfile(EntityProfileSpaceResponse.EntityExtendedProfile.builder()
                        .announcement(nullSafe(profile.getAnnouncement()))
                        .build())
                .teamsPreview(teamsPreview)
                .membersPreview(membersPreview)
                .infoRows(buildInfoRows(entity.getEntityCode(), profile, supportsLabs, teamCount))
                .build();
    }

    public EntityProfileHomeResponse getEntityProfileHome(String entityCode,
                                                          Integer teamLimit,
                                                          Integer projectLimit,
                                                          Integer noteLimit) {
        ClientEntity entity = requireAccessibleEntity(entityCode);
        boolean supportsLabs = supportsLabs(entity.getEntityCode());

        int resolvedTeamLimit = supportsLabs ? normalizeLimit(teamLimit, DEFAULT_HOME_TEAM_LIMIT) : 0;
        int resolvedProjectLimit = normalizeLimit(projectLimit, DEFAULT_HOME_PROJECT_LIMIT);
        int resolvedNoteLimit = normalizeLimit(noteLimit, DEFAULT_HOME_NOTE_LIMIT);

        List<EntityTeamPreviewItem> teams = supportsLabs
                ? toTeamPreviewItems(loadEntityLabs(entity.getEntityCode(), resolvedTeamLimit, 0))
                : Collections.emptyList();

        return EntityProfileHomeResponse.builder()
                .entityCode(entity.getEntityCode())
                .teams(teams)
                .projects(toProjectItems(loadEntityProjects(entity.getEntityCode(), resolvedProjectLimit, 0)))
                .notes(toNoteItems(loadEntityNotes(entity.getEntityCode(), null, resolvedNoteLimit, 0)))
                .teamTotal(supportsLabs ? countEntityLabs(entity.getEntityCode()) : 0L)
                .projectTotal(countEntityProjects(entity.getEntityCode()))
                .noteTotal(countEntityNotes(entity.getEntityCode(), null))
                .build();
    }

    public EntityProfileTeamsResponse getEntityProfileTeams(String entityCode, Integer page, Integer pageSize) {
        ClientEntity entity = requireAccessibleEntity(entityCode);
        if (!supportsLabs(entity.getEntityCode())) {
            return EntityProfileTeamsResponse.builder()
                    .entityCode(entity.getEntityCode())
                    .teams(Collections.emptyList())
                    .total(0L)
                    .page(normalizePage(page))
                    .pageSize(normalizePageSize(pageSize, DEFAULT_TEAM_PAGE_SIZE))
                    .build();
        }

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_TEAM_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        long total = countEntityLabs(entity.getEntityCode());

        return EntityProfileTeamsResponse.builder()
                .entityCode(entity.getEntityCode())
                .teams(toTeamPreviewItems(loadEntityLabs(entity.getEntityCode(), resolvedPageSize, offset)))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileMembersResponse getEntityProfileMembers(String entityCode, Integer page, Integer pageSize) {
        ClientEntity entity = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_MEMBER_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        long total = countEntityMembers(entity.getEntityCode());
        List<UserAuthLink> links = loadEntityMembers(entity.getEntityCode(), resolvedPageSize, offset);

        return EntityProfileMembersResponse.builder()
                .entityCode(entity.getEntityCode())
                .members(toMemberTabItems(links))
                .total(total)
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileProjectsResponse getEntityProfileProjects(String entityCode, Integer page, Integer pageSize) {
        ClientEntity entity = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_PROJECT_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;

        return EntityProfileProjectsResponse.builder()
                .entityCode(entity.getEntityCode())
                .projects(toProjectItems(loadEntityProjects(entity.getEntityCode(), resolvedPageSize, offset)))
                .total(countEntityProjects(entity.getEntityCode()))
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    public EntityProfileNotesResponse getEntityProfileNotes(String entityCode,
                                                            Integer page,
                                                            Integer pageSize,
                                                            String contentType) {
        ClientEntity entity = requireAccessibleEntity(entityCode);

        int resolvedPage = normalizePage(page);
        int resolvedPageSize = normalizePageSize(pageSize, DEFAULT_NOTE_PAGE_SIZE);
        int offset = (resolvedPage - 1) * resolvedPageSize;
        String dbContentType = mapNoteContentTypeFilter(contentType);

        return EntityProfileNotesResponse.builder()
                .entityCode(entity.getEntityCode())
                .notes(toNoteItems(loadEntityNotes(entity.getEntityCode(), dbContentType, resolvedPageSize, offset)))
                .total(countEntityNotes(entity.getEntityCode(), dbContentType))
                .page(resolvedPage)
                .pageSize(resolvedPageSize)
                .build();
    }

    private ClientEntity requireAccessibleEntity(String entityCode) {
        validateEntityCodeFormat(entityCode);
        ClientEntity entity = loadEntityByCode(entityCode.trim());
        if (entity == null) {
            throw BusinessException.notFound("ENTITY_NOT_FOUND");
        }
        if (!isEntityPubliclyVisible(entity)) {
            throw BusinessException.forbidden("ENTITY_NOT_ACCESSIBLE");
        }
        return entity;
    }

    private ClientEntityProfile requireEntityProfile(String entityCode) {
        ClientEntityProfile profile = loadEntityProfileByCode(entityCode);
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

    private ClientEntity loadEntityByCode(String entityCode) {
        LambdaQueryWrapper<ClientEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntity::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityMapper.selectOne(wrapper);
    }

    private ClientEntityProfile loadEntityProfileByCode(String entityCode) {
        LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientEntityProfile::getEntityCode, entityCode).last("LIMIT 1");
        return clientEntityProfileMapper.selectOne(wrapper);
    }

    private boolean isEntityPubliclyVisible(ClientEntity entity) {
        if (entity == null) {
            return false;
        }
        if (!"ACTIVE".equalsIgnoreCase(entity.getAccountStatus())) {
            return false;
        }
        return "APPROVED".equalsIgnoreCase(entity.getAuditStatus());
    }

    private LambdaQueryWrapper<ClientTeam> baseEntityLabWrapper(String entityCode) {
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getEntityCode, entityCode)
                .eq(ClientTeam::getType, "LAB")
                .eq(ClientTeam::getAuditStatus, "APPROVED")
                .eq(ClientTeam::getAccountStatus, "ACTIVE")
                .last("ORDER BY created_at DESC, id DESC");
        return wrapper;
    }

    private List<ClientTeam> loadEntityLabs(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientTeam> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientTeamMapper.selectPage(page, baseEntityLabWrapper(entityCode)).getRecords();
    }

    private long countEntityLabs(String entityCode) {
        return clientTeamMapper.selectCount(baseEntityLabWrapper(entityCode));
    }

    private LambdaQueryWrapper<UserAuthLink> baseEntityMemberWrapper(String entityCode) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getEntityCode, entityCode)
                .in(UserAuthLink::getRole, MEMBER_ROLES)
                .eq(UserAuthLink::getAuditStatus, "APPROVED")
                .eq(UserAuthLink::getIsActive, 1)
                .last("ORDER BY FIELD(role,'MENTOR','PM'), id ASC");
        return wrapper;
    }

    private List<UserAuthLink> loadEntityMembers(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<UserAuthLink> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return userAuthLinkMapper.selectPage(page, baseEntityMemberWrapper(entityCode)).getRecords();
    }

    private long countEntityMembers(String entityCode) {
        return userAuthLinkMapper.selectCount(baseEntityMemberWrapper(entityCode));
    }

    private LambdaQueryWrapper<ClientProject> baseEntityProjectWrapper(String entityCode) {
        LambdaQueryWrapper<ClientProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientProject::getExtendedUid, entityCode)
                .ne(ClientProject::getStatus, PROJECT_STATUS_DRAFT)
                .isNotNull(ClientProject::getPublishedAt)
                .last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ClientProject> loadEntityProjects(String entityCode, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientProject> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientProjectMapper.selectPage(page, baseEntityProjectWrapper(entityCode)).getRecords();
    }

    private long countEntityProjects(String entityCode) {
        return clientProjectMapper.selectCount(baseEntityProjectWrapper(entityCode));
    }

    private LambdaQueryWrapper<ClientNote> baseEntityNoteWrapper(String entityCode, String dbContentType) {
        LambdaQueryWrapper<ClientNote> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientNote::getExtendedUid, entityCode)
                .eq(ClientNote::getStatus, NOTE_STATUS_PUBLISHED);
        if (dbContentType != null) {
            wrapper.likeRight(ClientNote::getContentTypeCode, dbContentType);
        }
        wrapper.last("ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
        return wrapper;
    }

    private List<ClientNote> loadEntityNotes(String entityCode, String dbContentType, int pageSize, int offset) {
        int pageNum = pageSize <= 0 ? DEFAULT_PAGE : (offset / pageSize) + 1;
        Page<ClientNote> page = new Page<>(pageNum, pageSize);
        page.setSearchCount(false);
        return clientNoteMapper.selectPage(page, baseEntityNoteWrapper(entityCode, dbContentType)).getRecords();
    }

    private long countEntityNotes(String entityCode, String dbContentType) {
        return clientNoteMapper.selectCount(baseEntityNoteWrapper(entityCode, dbContentType));
    }

    /**
     * 组装实验室预览项，含负责人信息。
     * <p>
     * 批量加载负责人（owner_uid）的 profile，避免 N+1 查询。
     * </p>
     */
    private List<EntityTeamPreviewItem> toTeamPreviewItems(List<ClientTeam> teams) {
        if (teams.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, Long> memberCountByTeam = loadMemberCounts(
                teams.stream().map(ClientTeam::getTeamUid).collect(Collectors.toList()));

        // 批量加载所有负责人的 profile
        Set<String> ownerUids = teams.stream()
                .map(ClientTeam::getOwnerUid)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
        Map<String, ClientUserProfile> leaderProfileMap = ownerUids.isEmpty()
                ? Collections.emptyMap()
                : loadProfileMap(new ArrayList<>(ownerUids));

        List<EntityTeamPreviewItem> items = new ArrayList<>();
        for (ClientTeam team : teams) {
            String leaderUid = StringUtils.hasText(team.getOwnerUid()) ? team.getOwnerUid() : null;
            String leaderDisplayName = null;
            if (leaderUid != null) {
                ClientUserProfile leaderProfile = leaderProfileMap.get(leaderUid);
                if (leaderProfile != null) {
                    // 优先 realName，否则 nickname
                    leaderDisplayName = StringUtils.hasText(leaderProfile.getRealName())
                            ? leaderProfile.getRealName()
                            : (StringUtils.hasText(leaderProfile.getNickName()) ? leaderProfile.getNickName() : null);
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
        LambdaQueryWrapper<ClientTeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(ClientTeamMember::getTeamUid, teamUids);
        Map<String, Long> counts = new HashMap<>();
        for (ClientTeamMember member : clientTeamMemberMapper.selectList(wrapper)) {
            counts.merge(member.getTeamUid(), 1L, Long::sum);
        }
        return counts;
    }

    /**
     * 组装人员预览项（页壳）。
     * 机构为公开场合，nickname 和 realName 均优先返回实名。
     */
    private List<EntityMemberItem> toMemberPreviewItems(List<UserAuthLink> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                links.stream().map(UserAuthLink::getUserUid).collect(Collectors.toList()));
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserAuthLink link : links) {
            ClientUserProfile profile = profileMap.get(link.getUserUid());
            String realName = resolveDisplayName(profile);
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(realName)
                    .realName(realName)
                    .role(link.getRole())
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
    }

    /**
     * 组装成员 Tab 列表（实名优先）。
     */
    private List<EntityMemberItem> toMemberTabItems(List<UserAuthLink> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                links.stream().map(UserAuthLink::getUserUid).collect(Collectors.toList()));
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserAuthLink link : links) {
            ClientUserProfile profile = profileMap.get(link.getUserUid());
            String realName = resolveDisplayName(profile);
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(realName)
                    .realName(realName)
                    .role(link.getRole())
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
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

    private List<EntityProfileSpaceResponse.EntityInfoRow> buildInfoRows(String entityCode,
                                                                         ClientEntityProfile profile,
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
     * 机构公开场合的展示名：优先 realName，无则回退 nickname，最后回退"用户"。
     */
    private String resolveDisplayName(ClientUserProfile profile) {
        if (profile != null && StringUtils.hasText(profile.getRealName())) {
            return profile.getRealName().trim();
        }
        if (profile != null && StringUtils.hasText(profile.getNickName())) {
            return profile.getNickName().trim();
        }
        return "用户";
    }

    private String resolveLevel(ClientUserProfile profile) {
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
        // 名称唯一性校验（同一 entity 下）
        assertLabNameUnique(entityCode, request.getName().trim());

        ClientTeam team = new ClientTeam();
        team.setTeamUid(TeamUidGenerator.generateLab(uid -> isTeamUidUnique(uid)));
        team.setEntityCode(entityCode);
        team.setType("LAB");
        team.setTeamName(request.getName().trim());
        team.setOwnerUid(StringUtils.hasText(request.getLeaderUid()) ? request.getLeaderUid().trim() : null);
        team.setAccountStatus("ACTIVE");
        team.setAuditStatus("APPROVED");

        try {
            clientTeamMapper.insert(team);
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
        ClientTeam team = requireAccessibleLab(teamUid);
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
            LambdaUpdateWrapper<ClientTeam> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(ClientTeam::getTeamUid, teamUid);
            if (StringUtils.hasText(team.getTeamName())) {
                updateWrapper.set(ClientTeam::getTeamName, team.getTeamName());
            }
            updateWrapper.set(ClientTeam::getOwnerUid, team.getOwnerUid());
            clientTeamMapper.update(null, updateWrapper);
        }
    }

    /**
     * 删除实验室。
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteLab(String teamUid) {
        ClientTeam team = requireAccessibleLab(teamUid);
        // 级联清除团队内成员记录
        LambdaQueryWrapper<ClientTeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(ClientTeamMember::getTeamUid, teamUid);
        clientTeamMemberMapper.delete(memberWrapper);
        // 按 team_uid 删除（非主键）
        LambdaQueryWrapper<ClientTeam> teamWrapper = new LambdaQueryWrapper<>();
        teamWrapper.eq(ClientTeam::getTeamUid, teamUid);
        clientTeamMapper.delete(teamWrapper);
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

        // 先判断用户在当前 entity 下的已有 role，再按该 role 查精确记录
        LambdaQueryWrapper<UserAuthLink> roleLookupWrapper = new LambdaQueryWrapper<>();
        roleLookupWrapper.eq(UserAuthLink::getEntityCode, entityCode)
                .eq(UserAuthLink::getUserUid, uid)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        UserAuthLink anyExisting = userAuthLinkMapper.selectOne(roleLookupWrapper);
        String role = (anyExisting != null && StringUtils.hasText(anyExisting.getRole()))
                ? anyExisting.getRole().toUpperCase(Locale.ROOT)
                : "MENTOR";

        // 按 (entityCode, uid, role) 精确查找同类型记录（含 is_active=0 的历史记录）
        LambdaQueryWrapper<UserAuthLink> exactWrapper = new LambdaQueryWrapper<>();
        exactWrapper.eq(UserAuthLink::getEntityCode, entityCode)
                .eq(UserAuthLink::getUserUid, uid)
                .eq(UserAuthLink::getRole, role)
                .last("LIMIT 1");
        UserAuthLink exactExisting = userAuthLinkMapper.selectOne(exactWrapper);

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
            userAuthLinkMapper.updateById(exactExisting);
            return AddMemberResponse.builder()
                    .uid(uid)
                    .role(role)
                    .build();
        }

        // 无记录，创建新的 APPROVED 记录
        UserAuthLink link = new UserAuthLink();
        link.setUserUid(uid);
        link.setEntityCode(entityCode);
        link.setRole(role);
        link.setAuditStatus("APPROVED");
        link.setIsActive(1);
        userAuthLinkMapper.insert(link);

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
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getEntityCode, entityCode)
                .eq(UserAuthLink::getUserUid, uid)
                .in(UserAuthLink::getAuditStatus, "APPROVED", "PENDING", "REJECTED");
        List<UserAuthLink> links = userAuthLinkMapper.selectList(wrapper);
        if (links.isEmpty()) {
            throw BusinessException.notFound("MEMBER_NOT_FOUND");
        }

        for (UserAuthLink link : links) {
            link.setIsActive(0);
            userAuthLinkMapper.updateById(link);
        }
    }

    // ===================== 用户搜索 =====================

    /**
     * 模糊搜索用户（按 uid / nickname / realName 前缀或包含匹配）。
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
        LambdaQueryWrapper<UserAuthLink> authWrapper = new LambdaQueryWrapper<>();
        authWrapper.eq(UserAuthLink::getEntityCode, entityCode)
                .eq(UserAuthLink::getAuditStatus, "APPROVED")
                .eq(UserAuthLink::getIsActive, 1)
                .select(UserAuthLink::getUserUid);
        List<String> entityUserUids = userAuthLinkMapper.selectList(authWrapper).stream()
                .map(UserAuthLink::getUserUid)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());

        if (entityUserUids.isEmpty()) {
            return UserSearchResponse.builder().users(List.of()).build();
        }

        String kw = keyword.trim();

        // 在 profile 中模糊搜索，并限制 user_uid 属于该机构
        LambdaQueryWrapper<ClientUserProfile> profileWrapper = new LambdaQueryWrapper<>();
        profileWrapper.in(ClientUserProfile::getUserUid, entityUserUids)
                .and(w -> w
                        .like(ClientUserProfile::getUserUid, kw)
                        .or()
                        .like(ClientUserProfile::getNickName, kw)
                        .or()
                        .like(ClientUserProfile::getRealName, kw))
                .last("LIMIT 20");
        List<ClientUserProfile> profiles = clientUserProfileMapper.selectList(profileWrapper);

        List<UserSearchItem> users = profiles.stream()
                .map(p -> UserSearchItem.builder()
                        .uid(p.getUserUid())
                        .nickname(StringUtils.hasText(p.getNickName()) ? p.getNickName() : "用户")
                        .realName(StringUtils.hasText(p.getRealName()) ? p.getRealName() : null)
                        .avatarUrl(p.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        return UserSearchResponse.builder().users(users).build();
    }

    // ===================== 私有辅助方法 =====================

    private ClientTeam requireAccessibleLab(String teamUid) {
        if (!StringUtils.hasText(teamUid)) {
            throw BusinessException.notFound("TEAM_NOT_FOUND");
        }
        // 按 team_uid 查询（非主键 id），使用 LambdaQueryWrapper
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getTeamUid, teamUid.trim()).last("LIMIT 1");
        ClientTeam team = clientTeamMapper.selectOne(wrapper);
        if (team == null || !"LAB".equalsIgnoreCase(team.getType())) {
            throw BusinessException.notFound("TEAM_NOT_FOUND");
        }
        if (!"ACTIVE".equalsIgnoreCase(team.getAccountStatus())) {
            throw BusinessException.forbidden("TEAM_NOT_ACCESSIBLE");
        }
        return team;
    }

    private boolean isTeamUidUnique(String teamUid) {
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getTeamUid, teamUid);
        return clientTeamMapper.selectCount(wrapper) == 0;
    }

    private void assertSupportsLabs(String entityCode) {
        if (!supportsLabs(entityCode)) {
            throw BusinessException.badRequest("LABS_NOT_SUPPORTED");
        }
    }

    private void assertLabNameUnique(String entityCode, String name) {
        LambdaQueryWrapper<ClientTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeam::getEntityCode, entityCode)
                .eq(ClientTeam::getType, "LAB")
                .eq(ClientTeam::getTeamName, name)
                .last("LIMIT 1");
        if (clientTeamMapper.selectOne(wrapper) != null) {
            throw BusinessException.conflict("TEAM_NAME_DUPLICATE");
        }
    }

    private void assertUserExists(String userUid) {
        LambdaQueryWrapper<ClientUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUser::getUserUid, userUid).last("LIMIT 1");
        if (clientUserMapper.selectOne(wrapper) == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }
    }

    private void addOwnerAsTeamMember(String teamUid, String ownerUid) {
        // 若已存在 team_member 记录则跳过
        LambdaQueryWrapper<ClientTeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientTeamMember::getTeamUid, teamUid)
                .eq(ClientTeamMember::getUserUid, ownerUid)
                .last("LIMIT 1");
        if (clientTeamMemberMapper.selectOne(wrapper) != null) {
            return;
        }
        ClientTeamMember member = new ClientTeamMember();
        member.setTeamUid(teamUid);
        member.setUserUid(ownerUid);
        member.setRole("MENTOR");
        member.setIsAdmin(1);
        member.setInvitedByUid(null);
        try {
            clientTeamMemberMapper.insert(member);
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
        LambdaQueryWrapper<SysEntityTotpCredentials> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysEntityTotpCredentials::getAdminUid, adminUid)
                .last("LIMIT 1");
        SysEntityTotpCredentials admin = sysEntityTotpCredentialsMapper.selectOne(wrapper);
        return admin != null ? admin.getEntityCode() : null;
    }
}
