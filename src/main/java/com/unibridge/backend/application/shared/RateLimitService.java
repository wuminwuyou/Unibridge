package com.unibridge.backend.application.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * 基于 Redis 的验证码发放限流服务。
 *
 * <h2>三层计数器</h2>
 * <ul>
 *   <li><b>账户级</b>：同一手机/邮箱在时间窗口内的最大发送次数</li>
 *   <li><b>IP 级</b>：同一 IP 在时间窗口内的最大发送次数</li>
 *   <li><b>全局级</b>：全服务在时间窗口内的最大发送次数</li>
 * </ul>
 *
 * <h2>实现原理</h2>
 * 使用 Lua 脚本原子执行 INCR + EXPIRE + 阈值判断，避免 Redis 多命令竞态。
 *
 * <h2>防护目标</h2>
 * 防止：
 * <ul>
 *   <li>单一账户被恶意刷码（短信/邮箱轰炸）</li>
 *   <li>同一 IP 批量请求不同账户</li>
 *   <li>全服务级别流量异常</li>
 * </ul>
 */
@Component
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    private static final String REDIS_ACCOUNT_KEY = "auth:ratelimit:account:";
    private static final String REDIS_IP_KEY = "auth:ratelimit:ip:";
    private static final String REDIS_GLOBAL_KEY = "auth:ratelimit:global";

    /**
     * Lua 原子计数器脚本：
     * INCR key → 若 key 刚创建则设 EXPIRE → 比较是否超限
     *
     * KEYS[1]：目标 key
     * ARGV[1]：上限值
     * ARGV[2]：窗口秒数
     *
     * 返回 1（允许）/ 0（超限）
     */
    private static final String LUA_SLIDING_WINDOW = """
            local key   = KEYS[1]
            local limit = tonumber(ARGV[1])
            local ttl   = tonumber(ARGV[2])

            local current = redis.call('INCR', key)
            if current == 1 then
                redis.call('EXPIRE', key, ttl)
            end
            if current > limit then
                return 0
            end
            return 1
            """;

    private final RedisTemplate<String, Object> redisTemplate;
    private final DefaultRedisScript<Long> slidingWindowScript;

    /** 账户级上限（同手机/邮箱 / 时间窗口） */
    @Value("${auth.ratelimit.account.max:5}")
    private int accountMax;

    /** 账户级窗口秒数 */
    @Value("${auth.ratelimit.account.window-sec:600}")
    private int accountWindowSec;

    /** IP 级上限 */
    @Value("${auth.ratelimit.ip.max:10}")
    private int ipMax;

    /** IP 级窗口秒数 */
    @Value("${auth.ratelimit.ip.window-sec:600}")
    private int ipWindowSec;

    /** 全局上限 */
    @Value("${auth.ratelimit.global.max:100}")
    private int globalMax;

    /** 全局窗口秒数 */
    @Value("${auth.ratelimit.global.window-sec:60}")
    private int globalWindowSec;

    public RateLimitService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.slidingWindowScript = new DefaultRedisScript<>(LUA_SLIDING_WINDOW, Long.class);
    }

    /**
     * 校验验证码发放是否在三层限流范围内。
     *
     * @param account 手机号或邮箱
     * @param ip      客户端 IP
     * @throws RateLimitExceededException 任一层级超限时抛出
     */
    public void checkSendCodeRateLimit(String account, String ip) {
        // 1. 全局
        assertAllowed(REDIS_GLOBAL_KEY, globalMax, globalWindowSec, "全局");

        // 2. IP 级
        String ipKey = REDIS_IP_KEY + normalizeIp(ip);
        assertAllowed(ipKey, ipMax, ipWindowSec, "IP " + ip);

        // 3. 账户级
        String accountKey = REDIS_ACCOUNT_KEY + account;
        assertAllowed(accountKey, accountMax, accountWindowSec, "账户 " + account);
    }

    /**
     * 校验后回退三个计数器（当验证码生成/下发后续步骤失败时调用）。
     */
    public void rollbackSendCode(String account, String ip) {
        silentDecrement(REDIS_GLOBAL_KEY);
        silentDecrement(REDIS_IP_KEY + normalizeIp(ip));
        silentDecrement(REDIS_ACCOUNT_KEY + account);
    }

    private void assertAllowed(String key, int limit, int windowSec, String label) {
        Long result = redisTemplate.execute(
                slidingWindowScript,
                Collections.singletonList(key),
                String.valueOf(limit),
                String.valueOf(windowSec)
        );
        if (result == null || result == 0) {
            log.warn("[RATELIMIT] 验证码发送被限流：{}（{}/{}s）", label, limit, windowSec);
            throw new RateLimitExceededException(label, limit, windowSec);
        }
    }

    private void silentDecrement(String key) {
        try {
            Long val = redisTemplate.opsForValue().decrement(key);
            if (val != null && val <= 0) {
                redisTemplate.delete(key);
            }
        } catch (Exception ignored) {
            // 回退失败不影响主流程
        }
    }

    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "unknown";
        }
        return ip.trim();
    }

    /**
     * 限流异常，由 GlobalExceptionHandler 统一映射为 429 Too Many Requests。
     */
    public static class RateLimitExceededException extends RuntimeException {
        private final String label;
        private final int limit;
        private final int windowSec;

        public RateLimitExceededException(String label, int limit, int windowSec) {
            super("请求过于频繁（" + label + "），请 " + windowSec + " 秒后重试");
            this.label = label;
            this.limit = limit;
            this.windowSec = windowSec;
        }

        public String getLabel() {
            return label;
        }

        public int getLimit() {
            return limit;
        }

        public int getWindowSec() {
            return windowSec;
        }
    }
}
