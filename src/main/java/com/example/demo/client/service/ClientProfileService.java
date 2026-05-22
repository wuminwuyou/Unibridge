package com.example.demo.client.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.client.dto.ProfileMenuResponse;
import com.example.demo.client.dto.ProfileSpaceResponse;
import com.example.demo.client.entity.ClientEntityProfile;
import com.example.demo.client.entity.ClientTeam;
import com.example.demo.client.entity.ClientTeamMember;
import com.example.demo.client.entity.ClientUser;
import com.example.demo.client.entity.ClientUserProfile;
import com.example.demo.client.entity.UserAuthLink;
import com.example.demo.client.mapper.ClientEntityProfileMapper;
import com.example.demo.client.mapper.ClientTeamMapper;
import com.example.demo.client.mapper.ClientTeamMemberMapper;
import com.example.demo.client.mapper.ClientUserMapper;
import com.example.demo.client.mapper.ClientUserProfileMapper;
import com.example.demo.client.mapper.UserAuthLinkMapper;
import com.example.demo.common.BusinessException;
import com.example.demo.util.IpLocationUtils;
import com.example.demo.util.JwtUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ClientProfileService {

    private static final Logger log = LoggerFactory.getLogger(ClientProfileService.class);
    private static final String CLIENT_USER_TOKEN_TYPE = "CLIENT_USER";
    private static final String DEFAULT_AVATAR_TEXT = "U";
    private static final DateTimeFormatter JOIN_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };
    /** career_data 对象字段的展示顺序 */
    private static final List<String> CAREER_FIELD_ORDER = List.of(
            "school", "major", "grade", "degree", "title", "department", "company"
    );

    @Autowired
    private JwtUtil jwtUtil;

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

    /** UserProfileMenu 顶部菜单初始化数据。 */
    public ProfileMenuResponse getProfileMenu(String authorization) {
        Long userId = resolveCurrentUserId(authorization);

        ClientUser user = clientUserMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        ClientUserProfile profile = loadProfile(userId);
        return new ProfileMenuResponse(
                userId,
                nullSafe(profile == null ? null : profile.getNickName()),
                nullSafe(profile == null ? null : profile.getLevel()),
                nullSafe(profile == null ? null : profile.getAvatarUrl()),
                nullSafe(profile == null ? null : profile.getCurrentEntityName())
        );
    }

    /**
     * 个人空间页壳数据：Hero + Sidebar + 关联团队卡片，一次性返回。
     *
     * @param authorization Authorization 请求头
     * @param queryUserId   目标用户 ID；为空时取 token 中的当前用户
     * @param request       原始请求，用于解析 IP 属地
     */
    public ProfileSpaceResponse getProfileSpace(String authorization, Long queryUserId, HttpServletRequest request) {
        Long currentUserId = resolveCurrentUserId(authorization);
        Long targetUserId = queryUserId != null ? queryUserId : currentUserId;

        ClientUser user = clientUserMapper.selectById(targetUserId);
        if (user == null) {
            throw BusinessException.notFound("USER_NOT_FOUND");
        }

        ClientUserProfile profile = loadProfile(targetUserId);
        // position / organization 来自当前活跃身份（is_active=1）；机构「已认证」另判 audit_status=APPROVED
        UserAuthLink currentAuthLink = loadCurrentAuthLink(targetUserId);
        ProfileSpaceResponse.BaseInfo baseInfo = buildBaseInfo(profile, currentAuthLink);
        ProfileSpaceResponse.ExtendInfo extendInfo = buildExtendInfo(user, profile, currentAuthLink, request);
        ProfileSpaceResponse.AssociatedTeam associatedTeam = loadAssociatedTeam(targetUserId);

        return ProfileSpaceResponse.builder()
                .id(targetUserId)
                .baseInfo(baseInfo)
                .extendInfo(extendInfo)
                .associatedTeam(associatedTeam)
                .honors(Collections.emptyList())
                .activityHeatmap(Collections.emptyList())
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
     * 通过 user_auth_link.entity_id 关联 entity_profile.name 获取所属主体名称。
     * 无有效认证记录时回退 user_profile.current_entity_name。
     */
    private String resolveOrganization(UserAuthLink authLink, ClientUserProfile profile) {
        if (authLink != null && authLink.getEntityId() != null) {
            LambdaQueryWrapper<ClientEntityProfile> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ClientEntityProfile::getEntityId, authLink.getEntityId()).last("LIMIT 1");
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

    /** 按 user_profile 读取；优先 id=userId，回退 user_id 查询。 */
    private ClientUserProfile loadProfile(Long userId) {
        ClientUserProfile byId = clientUserProfileMapper.selectById(userId);
        if (byId != null) {
            return byId;
        }
        LambdaQueryWrapper<ClientUserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ClientUserProfile::getUserId, userId).last("LIMIT 1");
        return clientUserProfileMapper.selectOne(wrapper);
    }

    /**
     * 读取当前活跃机构身份（is_active=1），用于 position / organization。
     * 不要求 audit_status=APPROVED，待审核（PENDING）也应展示 role。
     */
    private UserAuthLink loadCurrentAuthLink(Long userId) {
        LambdaQueryWrapper<UserAuthLink> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserAuthLink::getUserId, userId)
                .eq(UserAuthLink::getIsActive, 1)
                .orderByDesc(UserAuthLink::getUpdatedAt)
                .last("LIMIT 1");
        return userAuthLinkMapper.selectOne(wrapper);
    }

    /** 查询用户关联的团队/实验室（优先实验室 LAB）。 */
    private ProfileSpaceResponse.AssociatedTeam loadAssociatedTeam(Long userId) {
        LambdaQueryWrapper<ClientTeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(ClientTeamMember::getUserId, userId);
        List<ClientTeamMember> memberships = clientTeamMemberMapper.selectList(memberWrapper);
        if (memberships.isEmpty()) {
            return null;
        }

        ClientTeam selectedTeam = null;
        for (ClientTeamMember membership : memberships) {
            ClientTeam team = clientTeamMapper.selectById(membership.getTeamId());
            if (team == null || !"ACTIVE".equalsIgnoreCase(team.getStatus())) {
                continue;
            }
            if ("LAB".equalsIgnoreCase(team.getType())) {
                selectedTeam = team;
                break;
            }
            if (selectedTeam == null) {
                selectedTeam = team;
            }
        }

        if (selectedTeam == null) {
            return null;
        }

        String entryPath = "LAB".equalsIgnoreCase(selectedTeam.getType())
                ? "/lab/" + selectedTeam.getId()
                : "/team/" + selectedTeam.getId();

        return ProfileSpaceResponse.AssociatedTeam.builder()
                .id(selectedTeam.getId())
                .name(nullSafe(selectedTeam.getTeamName()))
                .description(nullSafe(selectedTeam.getIntro()))
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

    private Long resolveCurrentUserId(String authorization) {
        String token = extractBearerToken(authorization);

        String userType;
        String userIdRaw;
        try {
            userType = jwtUtil.getUserType(token);
            userIdRaw = jwtUtil.getUserId(token);
        } catch (ExpiredJwtException ex) {
            throw BusinessException.unauthorized("ACCESS_TOKEN_EXPIRED");
        } catch (Exception ex) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        if (!CLIENT_USER_TOKEN_TYPE.equals(userType)) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }

        try {
            return Long.parseLong(userIdRaw);
        } catch (Exception ex) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw BusinessException.unauthorized("UNAUTHORIZED");
        }
        return token;
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
}
