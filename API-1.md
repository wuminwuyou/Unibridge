## 2) `GET /projects/evaluate/public-key` — 获取项目难度评估公钥

> **消费方**：`ProjectPublishForm` / 发布页"提交难度评估"按钮  
> **变更类型**：新增接口，返回 RSA-2048 OAEP SHA-256 公钥（PEM 格式），前端用其对项目内容详细描述加密后再提交评估。

### 端点

```
GET /api/v1/client/projects/evaluate/public-key
```

### 鉴权

- Bearer Token（Header: `Authorization: Bearer <accessToken>`）

### Response

```json
{
  "code": 200,
  "message": null,
  "data": {
    "keyId": "018f3a7e-9b3c-7412-a1b2-c3d4e5f6a7b8",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `keyId` | string | 密钥全局唯一标识（对应 sys_asymmetric_keys.key_id），提交评估时必须回传以定位解密私钥 |
| `publicKey` | string | PEM 格式的 RSA-2048 公钥 |

### 业务规则

- `keyId` 作为密钥对的唯一标识，前端须在后续 `POST /projects/evaluate` 中回传
- 前端首次请求公钥后须缓存 `{ keyId, publicKey }`，后续重复提交评估时直接复用缓存，**不再请求 GET /public-key**，以降低后端数据库写入压力
- 发布项目成功或离开发布页面时，前端须清除公钥缓存
- 公钥仅用于 `POST /projects/evaluate` 请求中对 `contentDetail` 的加密

---

## 3) `POST /projects/evaluate` — 提交项目难度评估

> **消费方**：`ProjectPublishForm` / 发布页"提交难度评估"按钮  
> **变更类型**：新增接口，接收公开的 `description` + 加密后的 `encryptedContentDetail`，返回模型评估的难度等级及修改建议。

### 端点

```
POST /api/v1/client/projects/evaluate
```

### 鉴权

- Bearer Token（Header: `Authorization: Bearer <accessToken>`）

### 请求体

```json
{
  "keyId": "018f3a7e-9b3c-7412-a1b2-c3d4e5f6a7b8",
  "description": "# 项目需求说明\n\n开发一个电商平台...",
  "encryptedContentDetail": "dGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVk..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyId` | string | 是 | 密钥标识（来自 GET /public-key 响应），后端据此定位正确的解密私钥 |
| `description` | string | 是 | 需求详情原文（公开项，不加密），Markdown 格式 |
| `encryptedContentDetail` | string | 是 | 项目内容详细描述，经 GET /projects/evaluate/public-key 获取的公钥，使用 RSA-OAEP with SHA-256 加密后的 base64 密文 |

### 响应

#### 评估通过（内容详尽、无需修改）

```json
{
  "code": 200,
  "message": null,
  "data": {
    "level": "B",
    "explanation": "该项目涉及多模块分布式架构设计、高并发数据一致性保障、以及跨团队的 DevOps 流程整合，技术复杂度与协调难度均较高，综合评定为复杂工程级（B）。",
    "suggestions": null
  }
}
```

#### 评估未通过（内容不够详尽，返回修改建议）

```json
{
  "code": 200,
  "message": null,
  "data": {
    "level": "D",
    "explanation": "根据已提供的描述，该项目属于常见 CRUD 应用范畴，技术难度较低。但由于内容中缺少核心模块、用户规模等关键信息，当前等级为初步评估，可能偏低。",
    "suggestions": "项目内容描述缺少以下细节：\n1. 目标用户的身份与数量\n2. 核心功能模块的详细说明\n3. 技术栈与工具链要求\n请补充后再试。"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `level` | string | 评估出的项目难度等级代号（S / A / B / C / D / E），对应研究突破级 → 入门操作级 |
| `explanation` | string | 评估结果说明，解释为什么给出该等级（始终返回，无论是否通过） |
| `suggestions` | string \| null | 当内容不够详尽时返回具体的修改指导；为 null 时表示评估通过 |

### 业务规则

- `level` 返回值必须是 S / A / B / C / D / E 之一，不可返回其他值
- `explanation` 必须返回，简明扼要说明等级评定依据（2-5 句）
- 当 `suggestions` 不为 null 时，前端展示修改建议卡片引导用户补充内容
- 当 `suggestions` 为 null 时，前端自动将 `level` 写入项目发布表单的"能力等级"字段
- 后端解密失败时返回 `400 (DECRYPT_FAILED)`，并附带 `"message": "解密失败，请重新获取公钥再试"`

### 验收要点

- [ ] 内容详尽时返回 `suggestions: null` 并给出合理等级与解释
- [ ] 内容简略/缺失关键信息时返回非空的 `suggestions`
- [ ] `explanation` 始终非空，与 `level` 逻辑一致
- [ ] `level` 始终为 S/A/B/C/D/E 合法值
- [ ] 解密失败时返回 400 错误
