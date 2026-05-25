package com.unibridge.backend.domain.feed;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.domain.feed.dto.FeedBehaviorEventRequest;
import com.unibridge.backend.infrastructure.entities.UserTagInterest;
import com.unibridge.backend.infrastructure.persistence.mapper.UserTagInterestMapper;
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
    private final UserTagInterestMapper userTagInterestMapper;

    public FeedBehaviorService(AccessService clientAccessService,
                               UserTagInterestMapper userTagInterestMapper) {
        this.clientAccessService = clientAccessService;
        this.userTagInterestMapper = userTagInterestMapper;
    }

    @Transactional
    public void trackEvent(String authorization, FeedBehaviorEventRequest request) {
        Long userId = clientAccessService.requireCurrentUserId(authorization);
        validateRequest(request);

        double delta = resolveWeightDelta(request.getEventType());
        for (String tag : request.getTags()) {
            if (!StringUtils.hasText(tag)) {
                continue;
            }
            upsertTagWeight(userId, tag.trim(), delta);
        }

        log.debug("Feed behavior tracked: userId={}, event={}, target={}/{}, tags={}",
                userId, request.getEventType(), request.getTargetType(), request.getTargetUid(), request.getTags());
    }

    private void upsertTagWeight(Long userId, String tag, double delta) {
        LambdaQueryWrapper<UserTagInterest> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserTagInterest::getUserId, userId)
                .eq(UserTagInterest::getTag, tag)
                .last("LIMIT 1");
        UserTagInterest existing = userTagInterestMapper.selectOne(wrapper);
        if (existing == null) {
            UserTagInterest created = new UserTagInterest();
            created.setUserId(userId);
            created.setTag(tag);
            created.setWeight(BigDecimal.valueOf(delta));
            userTagInterestMapper.insert(created);
            return;
        }
        BigDecimal next = existing.getWeight().add(BigDecimal.valueOf(delta));
        existing.setWeight(next);
        userTagInterestMapper.updateById(existing);
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
