// 01）通用接口记录类型（ApiRecord）
type ApiRecord = Record<string, unknown>;

// 02）字段别名定义类型（FieldAlias）
interface FieldAlias {
    camel: string;
    snake: string;
}

// 03）字段映射集合类型（FieldAliasMap）
type FieldAliasMap = Record<string, FieldAlias>;

// 04）请求字段映射集合类型（RequestFieldMap）
type RequestFieldMap = Record<string, string>;

// 05）统一字段映射关系中心（API_FIELD_MAPPINGS）
export const API_FIELD_MAPPINGS = {
    entity: {
        auditStatus: { camel: 'auditStatus', snake: 'audit_status' },
        createdAt: { camel: 'createdAt', snake: 'created_at' },
        lastLoginAt: { camel: 'lastLoginAt', snake: 'last_login_at' },
        updatedAt: { camel: 'updatedAt', snake: 'updated_at' },
        auditorName: { camel: 'auditorName', snake: 'auditor_name' },
        auditAdminId: { camel: 'auditAdminId', snake: 'audit_admin_id' },
        auditedAt: { camel: 'auditedAt', snake: 'audited_at' },
    },
    user: {
        realName: { camel: 'realName', snake: 'real_name' },
        currentEntityName: { camel: 'currentEntityName', snake: 'current_entity_name' },
        careerData: { camel: 'careerData', snake: 'career_data' },
        bioData: { camel: 'bioData', snake: 'bio_data' },
        lastLoginAt: { camel: 'lastLoginAt', snake: 'last_login_at' },
        createdAt: { camel: 'createdAt', snake: 'created_at' },
        updatedAt: { camel: 'updatedAt', snake: 'updated_at' },
        intro: { camel: 'intro', snake: 'intro' },
    },
    adminLogin: {
        refreshToken: { camel: 'refreshToken', snake: 'refresh_token' },
        authLevel: { camel: 'authLevel', snake: 'auth_level' },
        adminId: { camel: 'adminId', snake: 'admin_id' },
        lastLoginAt: { camel: 'lastLoginAt', snake: 'last_login_at' },
        createdAt: { camel: 'createdAt', snake: 'created_at' },
        updatedAt: { camel: 'updatedAt', snake: 'updated_at' },
    },
} as const satisfies Record<string, FieldAliasMap>;

// 06）统一请求字段映射关系中心（API_REQUEST_FIELD_MAPPINGS）
export const API_REQUEST_FIELD_MAPPINGS = {
    userProfile: {
        real_name: 'realName',
        current_entity_name: 'currentEntityName',
        bio_data: 'bioData',
        career_data: 'careerData',
    },
} as const satisfies Record<string, RequestFieldMap>;

// 07）后端数据驼峰转前端蛇形（mapApiCamelToFrontendSnake）
/**
 * 函数名：mapApiCamelToFrontendSnake
 * 功能：将后端响应中的驼峰差异字段统一转换为前端蛇形字段。
 * 实现方法：
 * - 复制原始对象，保留无差异字段
 * - 仅对映射表中的差异字段执行 camel -> snake 转换
 * - 转换后删除 camel 字段，前端统一消费 snake 字段
 * 输入：
 * - source：后端响应对象
 * - mapping：字段差异映射表（仅包含 camel/snake 不一致字段）
 * 输出：
 * - 返回值：转换后的对象（snake 风格）
 * - 副作用：无
 */
export function mapApiCamelToFrontendSnake(
    source: ApiRecord,
    mapping: FieldAliasMap,
): ApiRecord {
    const result: ApiRecord = { ...source };
    Object.values(mapping).forEach((alias) => {
        if (Object.prototype.hasOwnProperty.call(source, alias.camel)) {
            result[alias.snake] = source[alias.camel];
            delete result[alias.camel];
        }
    });
    return result;
}

// 08）前端数据蛇形转后端驼峰（mapFrontendSnakeToApiCamel）
/**
 * 函数名：mapFrontendSnakeToApiCamel
 * 功能：将前端提交对象中的蛇形差异字段转换为后端驼峰字段。
 * 实现方法：
 * - 复制原始对象，保留无差异字段
 * - 仅对映射表中的差异字段执行 snake -> camel 转换
 * - 转换后删除 snake 字段，提交给后端时统一使用 camel 字段
 * 输入：
 * - source：前端提交对象
 * - mapping：字段差异映射表（仅包含 camel/snake 不一致字段）
 * 输出：
 * - 返回值：转换后的对象（camel 风格）
 * - 副作用：无
 */
export function mapFrontendSnakeToApiCamel(
    source: Record<string, unknown>,
    mapping: RequestFieldMap,
): Record<string, unknown> {
    const result: Record<string, unknown> = { ...source };
    Object.entries(mapping).forEach(([snakeKey, camelKey]) => {
        if (Object.prototype.hasOwnProperty.call(source, snakeKey)) {
            result[camelKey] = source[snakeKey];
            delete result[snakeKey];
        }
    });
    return result;
}

// 09）读取字段原始值（getMappedValue）
/**
 * 函数名：getMappedValue
 * 功能：根据统一映射关系，从接口对象中读取字段值（优先驼峰，回退蛇形）。
 * 实现方法：
 * - 从映射中心读取字段别名配置
 * - 先读取 camel 命名字段
 * - 驼峰为空时再读取 snake 命名字段
 * 输入：
 * - source：接口响应对象
 * - mapping：字段映射集合
 * - key：业务字段键名（映射集合中的键）
 * 输出：
 * - 返回值：unknown（由调用方按字段类型继续收敛）
 * - 副作用：无
 */
export function getMappedValue(
    source: ApiRecord,
    mapping: FieldAliasMap,
    key: string,
): unknown {
    const alias = mapping[key];
    if (!alias) {
        return undefined;
    }
    const camelValue = source[alias.camel];
    if (camelValue !== undefined) {
        return camelValue;
    }
    return source[alias.snake];
}

// 10）读取字符串字段（getMappedString）
/**
 * 函数名：getMappedString
 * 功能：读取映射字段中的字符串值。
 * 实现方法：
 * - 调用 getMappedValue 获取原始值
 * - 仅当值类型为 string 时返回
 * 输入：
 * - source：接口响应对象
 * - mapping：字段映射集合
 * - key：业务字段键名
 * 输出：
 * - 返回值：string | undefined
 * - 副作用：无
 */
export function getMappedString(
    source: ApiRecord,
    mapping: FieldAliasMap,
    key: string,
): string | undefined {
    const value = getMappedValue(source, mapping, key);
    return typeof value === 'string' ? value : undefined;
}

// 11）读取可空字符串字段（getMappedNullableString）
/**
 * 函数名：getMappedNullableString
 * 功能：读取映射字段中的可空字符串值（string 或 null）。
 * 实现方法：
 * - 调用 getMappedValue 获取原始值
 * - 保留 null 语义，便于前端展示“未填写”等状态
 * 输入：
 * - source：接口响应对象
 * - mapping：字段映射集合
 * - key：业务字段键名
 * 输出：
 * - 返回值：string | null | undefined
 * - 副作用：无
 */
export function getMappedNullableString(
    source: ApiRecord,
    mapping: FieldAliasMap,
    key: string,
): string | null | undefined {
    const value = getMappedValue(source, mapping, key);
    if (typeof value === 'string' || value === null) {
        return value as string | null;
    }
    return undefined;
}

// 12）读取字符串数组字段（getMappedStringArray）
/**
 * 函数名：getMappedStringArray
 * 功能：读取映射字段中的字符串数组值。
 * 实现方法：
 * - 调用 getMappedValue 获取原始值
 * - 仅在值为数组时保留 string 元素
 * - 非数组回退为空数组
 * 输入：
 * - source：接口响应对象
 * - mapping：字段映射集合
 * - key：业务字段键名
 * 输出：
 * - 返回值：string[]
 * - 副作用：无
 */
export function getMappedStringArray(
    source: ApiRecord,
    mapping: FieldAliasMap,
    key: string,
): string[] {
    const value = getMappedValue(source, mapping, key);
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
}

// 13）按映射构建驼峰请求体（buildCamelRequestPayload）
/**
 * 函数名：buildCamelRequestPayload
 * 功能：将内部对象按统一映射关系转换为后端请求使用的驼峰字段对象。
 * 实现方法：
 * - 遍历请求字段映射表
 * - 读取源对象值并写入目标驼峰键
 * - 自动忽略 undefined 字段，避免发送无意义空值
 * 输入：
 * - source：内部对象（通常来自表单转换后的中间对象）
 * - mapping：请求字段映射集合
 * 输出：
 * - 返回值：Record<string, unknown>（可直接作为请求体片段）
 * - 副作用：无
 */
export function buildCamelRequestPayload(
    source: Record<string, unknown>,
    mapping: RequestFieldMap,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    Object.entries(mapping).forEach(([sourceKey, targetKey]) => {
        const value = source[sourceKey];
        if (value !== undefined) {
            result[targetKey] = value;
        }
    });
    return result;
}
