# TOFIX-ERROR

待修复/已修复错误的根因与验证检查清单。

---

## 1. 编译失败：`AuthService` 找不到 `LambdaUpdateWrapper`

**状态**：已修复（`AuthService.java` 已补充 `import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;`）

**原始日志**（2026-05-27）：

```
[ERROR] AuthService.java:[1149,9] 找不到符号
  符号:   类 LambdaUpdateWrapper
```

### 修复检查

- [x] `AuthService.java` 顶部存在 `LambdaUpdateWrapper` 的 import
- [ ] `mvn compile` 无编译错误
- [ ] 涉及 `LambdaUpdateWrapper` 的 TOTP/凭证更新逻辑可正常启动

---

## 2. `POST /api/v1/client/projects` → 400 `AMOUNT_PARSE_FAILED`

**状态**：待修复（前端传参问题，后端校验行为符合设计）

**日志时间**（2026-06-30 16:09，`logs/project-api.log`）：

| 次序 | 状态码 | 错误码 | 说明 |
|------|--------|--------|------|
| 1 | 401 | `ACCESS_TOKEN_EXPIRED` | Token 过期，需先刷新 |
| 2–4 | 400 | `AMOUNT_PARSE_FAILED` | 刷新 Token 后仍失败（DRAFT ×2、PUBLISH ×1） |

**调用栈**：

```
ProjectController.createProject
  → ProjectService.createProject
    → ProjectService.validateRequest (L293–294)
      → ProjectService.parseAmount (L388–400)
        → BusinessException: AMOUNT_PARSE_FAILED
```

**根因**：`channel=enterprise` 且 `amount` 非空时，后端用 `new BigDecimal(amount.trim())` 解析；当前请求里的 `amount` 含非数字字符或格式非法，触发 `NumberFormatException` 或负数校验。

**相关代码**：`ProjectService.java` → `validateRequest` / `parseAmount`  
**SQL 日志**：无对应写入（校验阶段即失败，未触库）

### 修复检查 — 前端（PublishProject）

- [ ] 提交前打印/抓包确认 `amount` 实际值（日志中 `description` 过长，`amount` 被截断未展示）
- [ ] `channel=enterprise` 时，`amount` 仅为纯数字字符串，如 `"18600"`、`"0"`
- [ ] 不传、传 `null`、传 `""` 均可（后端视为 `0`）
- [ ] 移除千分位、货币符号、中文单位：`"18,600"`、`"18600元"`、`"¥18600"`、`"1.86万"`、`"面议"` 均会 400
- [ ] 提交 payload 中 `amount` 类型为 **string**，勿传 JSON number 后再被格式化回写
- [ ] 输入框展示值与提交值分离：UI 可格式化展示，提交前 `strip` 为纯数字

### 修复检查 — 后端（可选增强，非必须）

- [ ] 若需兼容前端常见格式，可在 `parseAmount` 内预处理（去逗号、去货币符号）— 当前未实现，以 API 文档为准
- [ ] `GlobalExceptionHandler` 响应体是否包含 `AMOUNT_PARSE_FAILED` 便于前端提示（确认现有行为即可）

### 验证步骤

1. 使用有效 Token 调用 `POST /api/v1/client/projects`
2. 请求体示例（应成功）：

```json
{
  "publishAction": "DRAFT",
  "title": "测试",
  "summary": "摘要",
  "channel": "enterprise",
  "campusRecruitType": null,
  "description": "# 详情",
  "amount": "18600",
  "level": "SR",
  "skillTags": ["Vue3"]
}
```

3. `amount: ""` 或省略 `amount` → 应成功（预算为 0）
4. `amount: "18,600"` → 应仍 400（修复前预期；修复前端后不应再发送此格式）
5. `logs/project-sql.log` 成功时不应有异常；失败时不应有 INSERT（与当前行为一致）

### 关联文档

- `API.md`：`amount` 为预算数值字符串，解析为 DECIMAL；错误码 `AMOUNT_PARSE_FAILED`（400）
- 请求 DTO：`PublishProjectRequest.amount`（`String`）
