package com.unibridge.backend.infrastructure.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.redisson.api.RedissonClient;
import org.redisson.spring.cache.RedissonSpringCacheManager;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RedisConfig {

    /**
     * 原子校验并删除 SMS 验证码的 Lua 脚本，保证一次性消费（防重放）。
     */
    public static final DefaultRedisScript<String> VERIFY_AND_DELETE_SCRIPT;

    static {
        VERIFY_AND_DELETE_SCRIPT = new DefaultRedisScript<>();
        VERIFY_AND_DELETE_SCRIPT.setScriptText(
                "local val = redis.call('GET', KEYS[1]) " +
                "if val == false then return nil end " +
                "redis.call('DEL', KEYS[1]) " +
                "return val");
        VERIFY_AND_DELETE_SCRIPT.setResultType(String.class);
    }

    /**
     * Spring Data Redis 使用 Lettuce 连接工厂。
     * <p>
     * redisson-spring-boot-starter 会自动暴露 RedissonConnectionFactory，但它与当前 Spring Data Redis
     * 的 DefaultedRedisConnection 桥接存在 pExpire / zAdd 等方法无限递归的兼容性问题。
     * StringRedisTemplate 在 Feed 推送里会频繁设置 ZSET / Hash TTL，因此这里显式使用 Lettuce。
     * </p>
     */
    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory(RedisProperties redisProperties) {
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration();
        configuration.setHostName(redisProperties.getHost());
        configuration.setPort(redisProperties.getPort());
        configuration.setDatabase(redisProperties.getDatabase());
        if (redisProperties.getUsername() != null && !redisProperties.getUsername().isBlank()) {
            configuration.setUsername(redisProperties.getUsername());
        }
        if (redisProperties.getPassword() != null && !redisProperties.getPassword().isBlank()) {
            configuration.setPassword(RedisPassword.of(redisProperties.getPassword()));
        }
        return new LettuceConnectionFactory(configuration);
    }

    /**
     * Feed 缓存使用 RedissonSpringCacheManager。
     * <p>
     * Spring Cache 的 TTL 操作也不再经过 RedissonConnectionFactory，避免触发 DefaultedRedisConnection 递归。
     * </p>
     */
    @Bean
    public CacheManager cacheManager(RedissonClient redissonClient) {
        Map<String, org.redisson.spring.cache.CacheConfig> cacheConfigMap = new HashMap<>();

        org.redisson.spring.cache.CacheConfig homeFeedConfig = new org.redisson.spring.cache.CacheConfig();
        homeFeedConfig.setTTL(10 * 60 * 1000L); // 10 min
        cacheConfigMap.put(FeedCacheConfig.CACHE_HOME_FEED, homeFeedConfig);

        org.redisson.spring.cache.CacheConfig similarNotesConfig = new org.redisson.spring.cache.CacheConfig();
        similarNotesConfig.setTTL(60 * 60 * 1000L); // 1 hour
        cacheConfigMap.put(FeedCacheConfig.CACHE_SIMILAR_NOTES, similarNotesConfig);

        org.redisson.spring.cache.CacheConfig projectFeedConfig = new org.redisson.spring.cache.CacheConfig();
        projectFeedConfig.setTTL(10 * 60 * 1000L); // 10 min
        cacheConfigMap.put(FeedCacheConfig.CACHE_PROJECT_FEED, projectFeedConfig);

        org.redisson.spring.cache.CacheConfig noteFeedConfig = new org.redisson.spring.cache.CacheConfig();
        noteFeedConfig.setTTL(10 * 60 * 1000L); // 10 min
        cacheConfigMap.put(FeedCacheConfig.CACHE_NOTE_FEED, noteFeedConfig);

        RedissonSpringCacheManager cacheManager = new RedissonSpringCacheManager(redissonClient);

        cacheManager.setConfig(cacheConfigMap);

        return cacheManager;
    }

    /**
     * 通用 Object → JSON 序列化 RedisTemplate，用于存储复合对象（如 OrgChallengeRecord、FaceRecord）。
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        ObjectMapper om = redisObjectMapper();
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(om);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    private static ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return objectMapper;
    }
}
