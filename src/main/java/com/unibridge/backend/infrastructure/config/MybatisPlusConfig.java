package com.unibridge.backend.infrastructure.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.DynamicTableNameInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

/**
 * MyBatis-Plus 配置：通过 DynamicTableNameInnerInterceptor 实现按命名规范自动过滤表前缀。
 *
 * 规范说明：
 *   · t_    — 核心业务实体主表、关系表（如 t_user, t_project, t_team）
 *   · sys_  — 系统级基础设施、核心配置与授权表（如 sys_admin, sys_credit_logs）
 *   · p_    — Profile 画像扩展表（如 p_user_profile, p_tenant_org_profile）
 *   · log_  — 日志、审计流水表
 *
 * 策略：
 *   各 Entity 的 @TableName 填写不含前缀的裸表名。
 *   拦截器在 SQL 执行前检测原表名前缀：
 *     · 若以 sys_ / p_ / log_ 开头 → 原样透传（前缀已在 SQL 中）
 *     · 否则 → 自动补 t_ 前缀
 *   这样可以避免单个 table-prefix 只能指定一个前缀的限制。
 */
@Configuration
public class MybatisPlusConfig {

    /** 自带前缀透传的表名集合（这些前缀的表不需要额外添加 t_） */
    private static final Set<String> NATIVE_PREFIXES = Set.of("sys_", "p_", "log_", "audit_", "meta_");

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        DynamicTableNameInnerInterceptor dynamicTableNameInterceptor = new DynamicTableNameInnerInterceptor();
        dynamicTableNameInterceptor.setTableNameHandler((sql, tableName) -> {
            // 已经携带系统前缀的表名原样透传
            for (String prefix : NATIVE_PREFIXES) {
                if (tableName.startsWith(prefix)) {
                    return tableName;
                }
            }
            // 裸表名自动补 t_ 前缀
            return "t_" + tableName;
        });
        interceptor.addInnerInterceptor(dynamicTableNameInterceptor);
        return interceptor;
    }
}
