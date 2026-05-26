package com.unibridge.backend.domain.auth;

/** {@code sys_entity_totp_credentials.account_status} 常量。 */
public final class EntityAdminAccountStatus {

    public static final String ACTIVE = "ACTIVE";
    /** 已登记、待 TOTP 绑定；不可登录、不计入名额与主管理员 */
    public static final String PENDING = "PENDING";
    public static final String FROZEN = "FROZEN";
    public static final String DEACTIVATED = "DEACTIVATED";

    private EntityAdminAccountStatus() {
    }
}
