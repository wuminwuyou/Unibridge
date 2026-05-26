package com.unibridge.backend.domain.space;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.note.NoteCardAssembler;
import com.unibridge.backend.domain.project.ProjectCardAssembler;
import com.unibridge.backend.domain.space.dto.EntityMemberItem;
import com.unibridge.backend.domain.auth.EntityAdminCredentialService;
import com.unibridge.backend.domain.space.dto.EntityProfileHomeResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileMenuResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileMembersResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileNotesResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileProjectsResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileSpaceResponse;
import com.unibridge.backend.domain.space.dto.EntityProfileTeamsResponse;
import com.unibridge.backend.domain.space.dto.EntityTeamPreviewItem;
import com.unibridge.backend.domain.space.dto.ProfileNoteItem;
import com.unibridge.backend.domain.space.dto.ProfileProjectItem;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.ClientEntity;
import com.unibridge.backend.infrastructure.entities.ClientEntityProfile;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import com.unibridge.backend.infrastructure.entities.ClientProject;
import com.unibridge.backend.infrastructure.entities.ClientTeam;
import com.unibridge.backend.infrastructure.entities.ClientTeamMember;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import com.unibridge.backend.infrastructure.entities.UserAuthLink;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientEntityProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientNoteMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientProjectMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientTeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.ClientUserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserAuthLinkMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
public class EntitySpaceService {

    private static final Pattern ENTITY_CODE_PATTERN = Pattern.compile("^[0-9A-Za-z]{1,32}$");
    private static final Pattern UNIVERSITY_ENTITY_CODE_PATTERN = Pattern.compile("^\\d{5}$");
    private static final Set<String> MEMBER_ROLES = Set.of("PM", "MENTOR");
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

    private List<EntityTeamPreviewItem> toTeamPreviewItems(List<ClientTeam> teams) {
        if (teams.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, Long> memberCountByTeam = loadMemberCounts(
                teams.stream().map(ClientTeam::getTeamUid).collect(Collectors.toList()));
        List<EntityTeamPreviewItem> items = new ArrayList<>();
        for (ClientTeam team : teams) {
            items.add(EntityTeamPreviewItem.builder()
                    .teamUid(team.getTeamUid())
                    .name(nullSafe(team.getTeamName()))
                    .description(nullSafe(team.getIntro()))
                    .logoUrl(trimToNull(team.getTeamLogo()))
                    .memberCount(memberCountByTeam.getOrDefault(team.getTeamUid(), 0L).intValue())
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

    private List<EntityMemberItem> toMemberPreviewItems(List<UserAuthLink> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                links.stream().map(UserAuthLink::getUserUid).collect(Collectors.toList()));
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserAuthLink link : links) {
            ClientUserProfile profile = profileMap.get(link.getUserUid());
            String nickname = resolveNickname(profile);
            String realName = resolveRealName(profile);
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(nickname)
                    .realName(StringUtils.hasText(realName) ? realName : nickname)
                    .role(link.getRole())
                    .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                    .level(resolveLevel(profile))
                    .build());
        }
        return items;
    }

    private List<EntityMemberItem> toMemberTabItems(List<UserAuthLink> links) {
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClientUserProfile> profileMap = loadProfileMap(
                links.stream().map(UserAuthLink::getUserUid).collect(Collectors.toList()));
        List<EntityMemberItem> items = new ArrayList<>();
        for (UserAuthLink link : links) {
            ClientUserProfile profile = profileMap.get(link.getUserUid());
            items.add(EntityMemberItem.builder()
                    .uid(link.getUserUid())
                    .nickname(resolveNickname(profile))
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

    private String resolveNickname(ClientUserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getNickName())) {
            return "用户";
        }
        return profile.getNickName().trim();
    }

    private String resolveRealName(ClientUserProfile profile) {
        if (profile == null || !StringUtils.hasText(profile.getRealName())) {
            return null;
        }
        return profile.getRealName().trim();
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
}
