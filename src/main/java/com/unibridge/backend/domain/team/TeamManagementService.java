package com.unibridge.backend.domain.team;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.team.dto.CreateStudentTeamRequest;
import com.unibridge.backend.domain.team.dto.CreateStudentTeamResponse;
import com.unibridge.backend.domain.team.dto.SyncTeamMembersRequest;
import com.unibridge.backend.domain.team.dto.SyncTeamMembersResponse;
import com.unibridge.backend.domain.team.dto.TeamMemberItem;
import com.unibridge.backend.domain.user.dto.UserPublicPreviewResponse;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.team.Team;
import com.unibridge.backend.infrastructure.entities.team.TeamMember;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.profile.UserProfile;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import com.unibridge.backend.infrastructure.entities.profile.UserIdentity;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.team.TeamMemberMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserProfileMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserOrganizationBindingMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.profile.UserIdentityMapper;
import com.unibridge.backend.infrastructure.util.TeamUidGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

/**
 * 团队管理服务（写操作）：创建、成员同步、用户预览、团队解散。
 * <p>
 * 团队只读查询由 {@link TeamProfileService} 负责。
 * </p>
 */
@Service
public class TeamManagementService {

    private static final Pattern TEAM_UID_PATTERN = Pattern.compile("^(LB|ST)[A-Za-z0-9]{11}$");
    private static final Pattern USER_UID_PATTERN = Pattern.compile("^US[A-Za-z0-9]{11}$");
    private static final Set<String> ADDITION_ROLES = Set.of("MENTOR", "MEMBER");
    private static final Set<String> VALID_LEVELS = Set.of("N", "R", "SR", "SSR", "UR");

    @Autowired
    private AccessService accessService;

    @Autowired
    private TeamMapper teamMapper;

    @Autowired
    private TeamMemberMapper teamMemberMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private UserOrganizationBindingMapper userOrganizationBindingMapper;

    @Autowired
    private UserIdentityMapper userIdentityMapper;

    // ===================== 团队创建 =====================

    @Transactional(rollbackFor = Exception.class)
    public CreateStudentTeamResponse createStudentTeam(String authorization, CreateStudentTeamRequest request) {
        String userUid = accessService.requireCurrentUserUid(authorization);
        if (!StringUtils.hasText(userUid)) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        User user = loadUserByUid(userUid);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        UserOrganizationBinding authLink = requireVerifiedAuthLink(userUid);
        String creatorRole = StringUtils.hasText(authLink.getRole())
                ? authLink.getRole().toUpperCase(Locale.ROOT) : "STUDENT";
        String teamType = "STUDENT_TEAM";  // 数据库约束仅 LAB / STUDENT_TEAM
        String memberRole = "MENTOR".equals(creatorRole) ? "MENTOR" : "LEADER";

        String name = request.getName().trim();
        if (!StringUtils.hasText(name)) {
            throw BusinessException.badRequest("TEAM_NAME_REQUIRED");
        }
        if (name.length() > 32) {
            throw BusinessException.badRequest("TEAM_NAME_TOO_LONG");
        }

        Team team = new Team();
        team.setTeamUid(TeamUidGenerator.generateForType(teamType, this::isTeamUidUnique));
        team.setType(teamType);
        team.setTeamName(name);
        team.setOwnerUid(userUid);
        team.setIntro(StringUtils.hasText(request.getDescription())
                ? request.getDescription().trim().substring(0, Math.min(120, request.getDescription().trim().length()))
                : null);
        team.setAccountStatus("ACTIVE");
        try {
            teamMapper.insert(team);
        } catch (DuplicateKeyException e) {
            throw BusinessException.conflict("TEAM_ALREADY_EXISTS");
        }

        TeamMember creatorMember = new TeamMember();
        creatorMember.setTeamUid(team.getTeamUid());
        creatorMember.setUserUid(userUid);
        creatorMember.setRole(memberRole);
        creatorMember.setIsAdmin(1);
        try {
            teamMemberMapper.insert(creatorMember);
        } catch (DuplicateKeyException ignored) {}

        if (request.getInitialMemberUids() != null && !request.getInitialMemberUids().isEmpty()) {
            for (String memberUid : request.getInitialMemberUids()) {
                String trimmedUid = memberUid.trim();
                if (!StringUtils.hasText(trimmedUid) || trimmedUid.equals(userUid)) continue;
                if (loadUserByUid(trimmedUid) == null) continue;
                LambdaQueryWrapper<UserOrganizationBinding> mAuthWrapper = new LambdaQueryWrapper<>();
                mAuthWrapper.eq(UserOrganizationBinding::getUserUid, trimmedUid)
                        .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                        .eq(UserOrganizationBinding::getIsActive, 1).last("LIMIT 1");
                if (userOrganizationBindingMapper.selectOne(mAuthWrapper) == null) continue;
                TeamMember member = new TeamMember();
                member.setTeamUid(team.getTeamUid());
                member.setUserUid(trimmedUid);
                member.setRole("MEMBER");
                member.setIsAdmin(0);
                try { teamMemberMapper.insert(member); } catch (DuplicateKeyException ignored) {}
            }
        }
        return CreateStudentTeamResponse.builder().teamUid(team.getTeamUid()).name(team.getTeamName()).build();
    }

    // ===================== 成员同步 =====================

    @Transactional(rollbackFor = Exception.class)
    public SyncTeamMembersResponse syncTeamMembers(String authorization, String teamUid, SyncTeamMembersRequest request) {
        String currentUserUid = accessService.requireCurrentUserUid(authorization);
        Team team = requireAccessibleTeam(teamUid);
        requireTeamAdmin(team, currentUserUid);

        List<SyncTeamMembersRequest.MemberUpdate> updates = request == null || request.getUpdates() == null
                ? Collections.emptyList() : request.getUpdates();
        List<SyncTeamMembersRequest.MemberAddition> additions = request == null || request.getAdditions() == null
                ? Collections.emptyList() : request.getAdditions();
        List<SyncTeamMembersRequest.MemberRemoval> removals = request == null || request.getRemovals() == null
                ? Collections.emptyList() : request.getRemovals();
        if (updates.isEmpty() && additions.isEmpty() && removals.isEmpty()) {
            throw BusinessException.badRequest("TEAM_MEMBER_NO_CHANGES");
        }

        Map<String, TeamMember> memberByUid = loadMemberMap(teamUid);
        validateRemovals(team, removals, memberByUid);
        validateUpdates(team, updates, memberByUid);
        validateAdditions(team, additions, memberByUid);
        applyRemovals(removals, memberByUid);
        applyUpdates(team, updates, memberByUid);
        applyAdditions(team, additions, memberByUid, currentUserUid);

        List<TeamMember> refreshed = sortMembersForDisplay(team, loadTeamMemberships(teamUid));
        List<TeamMemberItem> members = buildMemberItems(team, refreshed, true);
        return SyncTeamMembersResponse.builder().teamUid(team.getTeamUid()).members(members).total((long) members.size()).build();
    }

    // ===================== 团队解散 =====================

    @Transactional(rollbackFor = Exception.class)
    public void dissolveTeam(String teamUid) {
        Team team = requireAccessibleTeam(teamUid);
        LambdaQueryWrapper<TeamMember> mw = new LambdaQueryWrapper<>();
        mw.eq(TeamMember::getTeamUid, teamUid);
        teamMemberMapper.delete(mw);
        LambdaQueryWrapper<Team> tw = new LambdaQueryWrapper<>();
        tw.eq(Team::getTeamUid, teamUid);
        teamMapper.delete(tw);
    }

    // ===================== 用户预览 =====================

    public UserPublicPreviewResponse getUserPublicPreview(String uid) {
        validateUserUidFormat(uid);
        User user = loadUserByUid(uid.trim());
        if (user == null) throw BusinessException.notFound("USER_NOT_FOUND");
        UserProfile profile = loadProfile(uid.trim());
        UserIdentity identity = loadIdentity(uid.trim());
        return UserPublicPreviewResponse.builder()
                .uid(user.getUserUid())
                .nickname(resolveRealNameOrNickname(profile, identity))
                .avatarUrl(trimToNull(profile == null ? null : profile.getAvatarUrl()))
                .build();
    }

    // ===================== 私有 — 鉴权 =====================

    private UserOrganizationBinding requireVerifiedAuthLink(String userUid) {
        LambdaQueryWrapper<UserOrganizationBinding> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrganizationBinding::getUserUid, userUid)
                .eq(UserOrganizationBinding::getAuditStatus, "APPROVED")
                .eq(UserOrganizationBinding::getIsActive, 1).last("LIMIT 1");
        UserOrganizationBinding link = userOrganizationBindingMapper.selectOne(wrapper);
        if (link == null) throw BusinessException.forbidden("USER_NOT_VERIFIED");
        return link;
    }

    private void requireTeamAdmin(Team team, String currentUserUid) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(currentUserUid)) return;
        TeamMember m = findMembership(team.getTeamUid(), currentUserUid);
        if (m == null || !resolveIsAdmin(team, m)) throw BusinessException.forbidden("TEAM_MEMBER_FORBIDDEN");
    }

    // ===================== 私有 — 团队加载 =====================

    private Team requireAccessibleTeam(String teamUid) {
        validateTeamUidFormat(teamUid);
        LambdaQueryWrapper<Team> w = new LambdaQueryWrapper<>();
        w.eq(Team::getTeamUid, teamUid.trim()).last("LIMIT 1");
        Team team = teamMapper.selectOne(w);
        if (team == null) throw BusinessException.notFound("TEAM_NOT_FOUND");
        if (team.getAccountStatus() == null || !"ACTIVE".equalsIgnoreCase(team.getAccountStatus()))
            throw BusinessException.forbidden("TEAM_NOT_ACCESSIBLE");
        if ("LAB".equalsIgnoreCase(team.getType()) && !"APPROVED".equalsIgnoreCase(team.getAuditStatus()))
            throw BusinessException.forbidden("TEAM_NOT_ACCESSIBLE");
        return team;
    }

    private List<TeamMember> loadTeamMemberships(String teamUid) {
        LambdaQueryWrapper<TeamMember> w = new LambdaQueryWrapper<>();
        w.eq(TeamMember::getTeamUid, teamUid);
        return teamMemberMapper.selectList(w);
    }

    private TeamMember findMembership(String teamUid, String userUid) {
        LambdaQueryWrapper<TeamMember> w = new LambdaQueryWrapper<>();
        w.eq(TeamMember::getTeamUid, teamUid).eq(TeamMember::getUserUid, userUid).last("LIMIT 1");
        return teamMemberMapper.selectOne(w);
    }

    private boolean isTeamUidUnique(String teamUid) {
        LambdaQueryWrapper<Team> w = new LambdaQueryWrapper<>();
        w.eq(Team::getTeamUid, teamUid);
        return teamMapper.selectCount(w) == 0;
    }

    // ===================== 私有 — 用户 =====================

    private User loadUserByUid(String userUid) {
        LambdaQueryWrapper<User> w = new LambdaQueryWrapper<>();
        w.eq(User::getUserUid, userUid).last("LIMIT 1");
        return userMapper.selectOne(w);
    }

    private UserProfile loadProfile(String userUid) {
        LambdaQueryWrapper<UserProfile> w = new LambdaQueryWrapper<>();
        w.eq(UserProfile::getUserUid, userUid).last("LIMIT 1");
        return userProfileMapper.selectOne(w);
    }

    private Map<String, UserProfile> loadProfileMap(List<String> userUids) {
        if (userUids.isEmpty()) return Collections.emptyMap();
        LambdaQueryWrapper<UserProfile> w = new LambdaQueryWrapper<>();
        w.in(UserProfile::getUserUid, userUids);
        Map<String, UserProfile> m = new HashMap<>();
        for (UserProfile p : userProfileMapper.selectList(w)) m.put(p.getUserUid(), p);
        return m;
    }

    private void assertUserExists(String userUid) {
        if (loadUserByUid(userUid) == null) throw BusinessException.notFound("USER_NOT_FOUND");
    }

    // ===================== 私有 — 成员排序与显示 =====================

    private List<TeamMember> sortMembersForDisplay(Team team, List<TeamMember> memberships) {
        if (memberships.isEmpty()) return Collections.emptyList();
        Map<String, UserProfile> pm = loadProfileMap(memberships.stream().map(TeamMember::getUserUid).collect(Collectors.toList()));
        return memberships.stream()
                .sorted(Comparator.comparingInt((TeamMember m) -> previewTier(team, m))
                        .thenComparing((TeamMember m) -> levelOrder(pm.get(m.getUserUid())), Comparator.reverseOrder())
                        .thenComparing(m -> m.getJoinedAt() == null ? java.time.LocalDateTime.MAX : m.getJoinedAt()))
                .collect(Collectors.toList());
    }

    private int previewTier(Team team, TeamMember member) {
        if (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(member.getUserUid())) return 0;
        return "MENTOR".equalsIgnoreCase(member.getRole()) ? 1 : 2;
    }

    private int levelOrder(UserProfile profile) {
        String l = resolveLevel(profile);
        return l == null ? 0 : java.util.Map.of("UR", 5, "SSR", 4, "SR", 3, "R", 2, "N", 1).getOrDefault(l, 0);
    }

    private List<TeamMemberItem> buildMemberItems(Team team, List<TeamMember> orderedSlice, boolean showRealName) {
        if (orderedSlice.isEmpty()) return Collections.emptyList();
        List<String> uids = orderedSlice.stream().map(TeamMember::getUserUid).collect(Collectors.toList());
        Map<String, UserProfile> pm = loadProfileMap(uids);
        Map<String, UserIdentity> im = loadIdentityMap(uids);
        List<TeamMemberItem> items = new ArrayList<>();
        for (TeamMember m : orderedSlice) {
            UserProfile p = pm.get(m.getUserUid());
            UserIdentity identity = im.get(m.getUserUid());
            items.add(TeamMemberItem.builder()
                    .uid(m.getUserUid())
                    .nickname(resolveMemberDisplayName(p, showRealName, identity))
                    .role(resolveMemberRole(m))
                    .career(trimToNull(m.getCareer()))
                    .isAdmin(resolveIsAdmin(team, m))
                    .isOwner(resolveIsOwner(team, m))
                    .invitedByUid(resolveInvitedByUid(team, m))
                    .avatarUrl(trimToNull(p == null ? null : p.getAvatarUrl()))
                    .level(resolveLevel(p)).build());
        }
        return items;
    }

    private String resolveMemberRole(TeamMember m) { return StringUtils.hasText(m.getRole()) ? m.getRole().trim().toUpperCase(Locale.ROOT) : "MEMBER"; }
    private boolean resolveIsOwner(Team team, TeamMember m) { return StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(m.getUserUid()); }
    private boolean resolveIsAdmin(Team team, TeamMember m) { return (m.getIsAdmin() != null && m.getIsAdmin() == 1) || (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(m.getUserUid())); }
    private String resolveInvitedByUid(Team team, TeamMember m) { return (StringUtils.hasText(team.getOwnerUid()) && team.getOwnerUid().equals(m.getUserUid())) ? null : trimToNull(m.getInvitedByUid()); }
    private String resolveLevel(UserProfile p) { if (p == null || !StringUtils.hasText(p.getLevel())) return null; String l = p.getLevel().trim().toUpperCase(Locale.ROOT); return VALID_LEVELS.contains(l) ? l : null; }

    // ===================== 校验 =====================

    private void validateTeamUidFormat(String uid) { if (!StringUtils.hasText(uid) || !TEAM_UID_PATTERN.matcher(uid.trim()).matches()) throw BusinessException.badRequest("INVALID_TEAM_UID"); }
    private void validateUserUidFormat(String uid) { if (!StringUtils.hasText(uid) || !USER_UID_PATTERN.matcher(uid.trim()).matches()) throw BusinessException.badRequest("INVALID_USER_UID"); }
    private String normalizeRequiredUserUid(String uid) { validateUserUidFormat(uid); return uid.trim(); }
    private String normalizeAdditionRole(String role) { if (!StringUtils.hasText(role)) throw BusinessException.badRequest("TEAM_MEMBER_CAREER_REQUIRED"); String n = role.trim().toUpperCase(Locale.ROOT); if (!ADDITION_ROLES.contains(n)) throw BusinessException.badRequest("INVALID_MEMBER_ROLE"); return n; }
    private void requireNonEmptyCareer(String c) { if (!StringUtils.hasText(c) || c.trim().isEmpty()) throw BusinessException.badRequest("TEAM_MEMBER_CAREER_REQUIRED"); }

    // ===================== 校验成员操作 =====================

    private void validateRemovals(Team team, List<SyncTeamMembersRequest.MemberRemoval> removals, Map<String, TeamMember> mb) {
        if (removals.isEmpty()) return;
        Set<String> ruids = new HashSet<>();
        for (var r : removals) ruids.add(normalizeRequiredUserUid(r.getUid()));
        if (mb.size() - ruids.size() < 1) throw BusinessException.badRequest("TEAM_MEMBER_LAST_ONE");
        for (String uid : ruids) {
            if (isOwnerUid(team, uid)) throw BusinessException.badRequest("TEAM_MEMBER_OWNER_IMMUTABLE");
            if (!mb.containsKey(uid)) throw BusinessException.notFound("TEAM_MEMBER_NOT_FOUND");
        }
    }
    private void validateUpdates(Team team, List<SyncTeamMembersRequest.MemberUpdate> updates, Map<String, TeamMember> mb) {
        for (var u : updates) {
            String uid = normalizeRequiredUserUid(u.getUid());
            if (!mb.containsKey(uid)) throw BusinessException.notFound("TEAM_MEMBER_NOT_FOUND");
            requireNonEmptyCareer(u.getCareer());
            assertUserExists(uid);
        }
    }
    private void validateAdditions(Team team, List<SyncTeamMembersRequest.MemberAddition> additions, Map<String, TeamMember> mb) {
        for (var a : additions) {
            String uid = normalizeRequiredUserUid(a.getUid());
            if (mb.containsKey(uid)) throw BusinessException.conflict("TEAM_MEMBER_ALREADY_EXISTS");
            assertUserExists(uid);
            String role = normalizeAdditionRole(a.getRole());
            requireNonEmptyCareer(a.getCareer());
            if ("LAB".equalsIgnoreCase(team.getType()) && "MEMBER".equals(role)) {
                LambdaQueryWrapper<TeamMember> w = new LambdaQueryWrapper<>();
                w.eq(TeamMember::getLabUserUid, uid);
                if (teamMemberMapper.selectCount(w) > 0) throw BusinessException.conflict("TEAM_MEMBER_LAB_CONFLICT");
            }
        }
    }

    // ===================== 应用成员操作 =====================

    private void applyRemovals(List<SyncTeamMembersRequest.MemberRemoval> removals, Map<String, TeamMember> mb) {
        for (var r : removals) { TeamMember m = mb.get(r.getUid().trim()); if (m != null) { teamMemberMapper.deleteById(m.getId()); mb.remove(r.getUid().trim()); } }
    }
    private void applyUpdates(Team team, List<SyncTeamMembersRequest.MemberUpdate> updates, Map<String, TeamMember> mb) {
        for (var u : updates) {
            String uid = u.getUid().trim(); TeamMember m = mb.get(uid); if (m == null) continue;
            LambdaUpdateWrapper<TeamMember> w = new LambdaUpdateWrapper<>();
            w.eq(TeamMember::getId, m.getId());
            w.set(TeamMember::getCareer, u.getCareer().trim());
            if (isOwnerUid(team, uid)) w.set(TeamMember::getIsAdmin, 1);
            else if (u.getIsAdmin() != null) w.set(TeamMember::getIsAdmin, Boolean.TRUE.equals(u.getIsAdmin()) ? 1 : 0);
            teamMemberMapper.update(null, w);
        }
    }
    private void applyAdditions(Team team, List<SyncTeamMembersRequest.MemberAddition> additions, Map<String, TeamMember> mb, String invitedByUid) {
        for (var a : additions) {
            String uid = a.getUid().trim(); String role = normalizeAdditionRole(a.getRole());
            TeamMember m = new TeamMember();
            m.setTeamUid(team.getTeamUid()); m.setUserUid(uid); m.setRole(role); m.setCareer(a.getCareer().trim());
            m.setIsAdmin(0); m.setInvitedByUid(invitedByUid);
            if ("LAB".equalsIgnoreCase(team.getType()) && "MEMBER".equals(role)) m.setLabUserUid(uid);
            try { teamMemberMapper.insert(m); } catch (DuplicateKeyException e) { throw BusinessException.conflict("TEAM_MEMBER_LAB_CONFLICT"); }
            mb.put(uid, m);
        }
    }

    // ===================== 工具方法 =====================

    private Map<String, TeamMember> loadMemberMap(String teamUid) { Map<String, TeamMember> m = new HashMap<>(); for (var member : loadTeamMemberships(teamUid)) m.put(member.getUserUid(), member); return m; }
    private String resolveNickname(UserProfile p) { return p == null || !StringUtils.hasText(p.getNickName()) ? "用户" : p.getNickName().trim(); }
    private String resolveRealNameOrNickname(UserProfile p, UserIdentity identity) { if (identity != null && StringUtils.hasText(identity.getRealNameMask())) return identity.getRealNameMask().trim(); return resolveNickname(p); }
    private String resolveMemberDisplayName(UserProfile p, boolean showRealName, UserIdentity identity) { return showRealName ? resolveRealNameOrNickname(p, identity) : resolveNickname(p); }
    private boolean isOwnerUid(Team t, String uid) { return StringUtils.hasText(t.getOwnerUid()) && t.getOwnerUid().equals(uid); }
    private String trimToNull(String v) { return StringUtils.hasText(v) ? v.trim() : null; }

    private UserIdentity loadIdentity(String userUid) {
        LambdaQueryWrapper<UserIdentity> w = new LambdaQueryWrapper<>();
        w.eq(UserIdentity::getUserUid, userUid).last("LIMIT 1");
        return userIdentityMapper.selectOne(w);
    }

    private Map<String, UserIdentity> loadIdentityMap(List<String> userUids) {
        if (userUids.isEmpty()) return Collections.emptyMap();
        LambdaQueryWrapper<UserIdentity> w = new LambdaQueryWrapper<>();
        w.in(UserIdentity::getUserUid, userUids);
        Map<String, UserIdentity> m = new HashMap<>();
        for (UserIdentity id : userIdentityMapper.selectList(w)) {
            m.put(id.getUserUid(), id);
        }
        return m;
    }
}
