package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.feed.dto.FeedBehaviorEventRequest;
import com.unibridge.backend.infrastructure.entities.interaction.UserInterestTag;
import com.unibridge.backend.infrastructure.persistence.mapper.interaction.UserInterestTagMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 用户行为埋点 → {@code user_tag_interests} 权重累加。
 */
@Service
public class FeedBehaviorService {

    private static final Logger log = LoggerFactory.getLogger(FeedBehaviorService.class);

    private static final Set<String> VALID_EVENT_TYPES = Set.of("VIEW_DETAIL", "LIKE", "COLLECT");
    private static final Set<String> VALID_TARGET_TYPES = Set.of("NOTE", "PROJECT");

    private final AccessService clientAccessService;
    private final UserInterestTagMapper userInterestTagMapper;

    public FeedBehaviorService(AccessService clientAccessService,
                               UserInterestTagMapper userInterestTagMapper) {
        this.clientAccessService = clientAccessService;
        this.userInterestTagMapper = userInterestTagMapper;
    }

    @Transactional
    public void trackEvent(String authorization, FeedBehaviorEventRequest request) {
        String userUid = clientAccessService.requireCurrentUserUid(authorization);
        validateRequest(request);

        double delta = resolveWeightDelta(request.getEventType());
        for (String tag : request.getTags()) {
            if (!StringUtils.hasText(tag)) {
                continue;
            }
            upsertTagWeight(userUid, tag.trim(), delta);
        }

        log.debug("Feed behavior tracked: userUid={}, event={}, target={}/{}, tags={}",
                userUid, request.getEventType(), request.getTargetType(), request.getTargetUid(), request.getTags());
    }

    /**
     * 更新或创建用户标签权重。
     * <p>
     * 【并发安全】先查后改（select → updateById）存在 TOCTOU 竞态和丢失更新风险。
     * 改为数据库原子加法：{@code SET weight = weight + delta}，
     * 若影响行数为 0（记录不存在），则插入新记录。
     * 数据库 {@code uk_user_tag (user_uid, tag)} 唯一索引兜底并发 insert。
     * </p>
     */
    private void upsertTagWeight(String userUid, String tag, double delta) {
        // 先尝试原子加法更新
        LambdaUpdateWrapper<UserInterestTag> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(UserInterestTag::getUserUid, userUid)
                .eq(UserInterestTag::getTag, tag)
                .setSql("weight = weight + " + new BigDecimal(String.valueOf(delta)).toPlainString());
        int rows = userInterestTagMapper.update(null, updateWrapper);
        if (rows > 0) {
            return;
        }
        // 记录不存在，创建新记录（数据库唯一索引 uk_user_tag 兜底并发）
        UserInterestTag created = new UserInterestTag();
        created.setUserUid(userUid);
        created.setTag(tag);
        created.setWeight(BigDecimal.valueOf(delta));
        try {
            userInterestTagMapper.insert(created);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 并发创建，重试原子加法
            userInterestTagMapper.update(null, updateWrapper);
        }
    }

    private double resolveWeightDelta(String eventType) {
        return switch (eventType.toUpperCase(Locale.ROOT)) {
            case "VIEW_DETAIL" -> 0.5;
            case "LIKE" -> 2.0;
            case "COLLECT" -> 3.0;
            default -> 0;
        };
    }

    private void validateRequest(FeedBehaviorEventRequest request) {
        if (request == null) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getEventType())
                || !VALID_EVENT_TYPES.contains(request.getEventType().toUpperCase(Locale.ROOT))) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getTargetType())
                || !VALID_TARGET_TYPES.contains(request.getTargetType().toUpperCase(Locale.ROOT))) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (!StringUtils.hasText(request.getTargetUid())) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
        if (request.getTags() == null || request.getTags().isEmpty()) {
            throw BusinessException.badRequest("VALIDATION_FAILED");
        }
    }
}
