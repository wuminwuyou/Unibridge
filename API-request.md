# UniBridge 前端待办 API 增量

> **用途**：尚未并入全量契约的待办 API 需求，供后端实现。  
> **全量契约**：[`API.md`](./API.md)（项目 `owner`、笔记卡片 `ProfileNoteItem` 等已并入 **§01.4**、**§06.1**、**第四部分 Feed**）  
> **Base**：`/api/v1/client`

---

## 当前状态

| 模块 | 后端 | 前端 |
|------|------|------|
| 查询视频笔记的学习笔记列表 `GET /notes/{uid}/children` | **待实现** | 待接入 |

---

## 1) `GET /notes/{uid}/children` — 查询视频笔记的学习笔记列表

> **消费方**：`NoteQuickMdEditor` / 视频详情右侧栏  
> **变更类型**：新增接口需求，查询某视频笔记下所有已发布的图文学习笔记

### 说明

视频详情页右侧栏需要展示该视频笔记关联的全部学习笔记列表。通过 `t_user_note_detail.parent_content_type_code` 查询所有子笔记。

### 端点

```
GET /api/v1/client/notes/{uid}/children
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | 是 | 父视频笔记 UID（`VD` + 11 位） |

### Response

```json
{
  "code": 200,
  "message": null,
  "data": [
    {
      "uid": "TXa8f2K9w3N7p",
      "publishAction": "PUBLISH",
      "title": "如何设计一个高质量用户系统",
      "summary": "结合权限模型与可观测方案的经验分享。",
      "contentType": "图文",
      "content": "# 如何设计一个高质量用户系统\n\n...",
      "tags": ["系统设计", "用户体系"],
      "coverUrl": "https://cdn.example.com/notes/cover/auto-generated.jpg",
      "videoUrl": null,
      "videoDuration": null,
      "visibility": "PUBLIC"
    }
  ]
}
```

### 业务规则

- 仅返回 `status = PUBLISHED` 且 `visibility = PUBLIC` 的子笔记
- 不返回 `REVIEWING`（审核中）、`DRAFT`（草稿）、`DELETED`（已删除）、`BANNED`（封禁）状态的子笔记
- 若父笔记被封禁（`BANNED`），统一返回 `404 (NOTE_NOT_FOUND)`
- 无子笔记时返回空数组 `[]`

### 验收要点

- [ ] 父视频存在已发布 PUBLIC 子笔记时返回完整列表
- [ ] 父视频无子笔记时返回 `[]`
- [ ] 父笔记 `BANNED` 时返回 `404`

---

## 2) `GET /projects/evaluate/public-key` — 获取项目难度评估公钥

> **消费方**：`ProjectPublishForm` / 发布页"提交难度评估"按钮  
> **变更类型**：新增接口，返回 RSA-2048 OAEP SHA-256 公钥（PEM 格式），前端用于混合加密方案中包裹 AES-256-GCM 会话密钥。

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
    "publicKey": "RSA-2048-OAEP\n-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `keyId` | string | 密钥全局唯一标识（对应 sys_asymmetric_keys.key_id），提交评估时必须回传以定位解密私钥 |
| `publicKey` | string | 带算法头的 PEM 公钥，格式：`RSA-2048-OAEP\n-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`。前端解析算法头后按对应密钥长度选择 SHA-256/384 摘要 |

### 业务规则

- `keyId` 作为密钥对的唯一标识，前端须在后续 `POST /projects/evaluate` 中回传
- 前端首次请求公钥后须缓存 `{ keyId, publicKey }`，后续重复提交评估时直接复用缓存，**不再请求 GET /public-key**，以降低后端数据库写入压力
- 发布项目成功或离开发布页面时，前端须清除公钥缓存
- 公钥仅用于混合加密方案：RSA-OAEP 包裹 AES-256-GCM 会话密钥（`wrappedKey`），**不对长文本直接做 RSA 加密**

---

## 3) `POST /projects/evaluate` — 提交项目难度评估

> **消费方**：`ProjectPublishForm` / 发布页"提交难度评估"按钮  
> **变更类型**：新增接口，接收公开的 `description` + 混合加密后的 `encryptedContentDetail`，返回模型评估的难度等级及修改建议。

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
  "encryptedContentDetail": "base64(rsaEncryptedAesKey).base64(iv).base64(aesGcmCiphertext)"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyId` | string | 是 | 密钥标识（来自 GET /public-key 响应），后端据此定位正确的解密私钥 |
| `description` | string | 是 | 需求详情原文（公开项，不加密），Markdown 格式 |
| `encryptedContentDetail` | string | 是 | **混合加密密文**，由三段 base64 字符串以 `.` 连接（详见下方"加密流程"） |

### encryptedContentDetail 加密流程（前端）

```
1. 解析 publicKey 中的算法头（"RSA-2048-OAEP" → SHA-256）
2. 导入 RSA 公钥（SPKI）
3. 生成一次性 AES-256-GCM 会话密钥
4. 用 AES-256-GCM 加密「项目内容详细描述」明文
   → 产生 12B IV + 密文（末尾 16B 为 auth tag）
5. 导出 AES 原始密钥（32B raw），用 RSA-OAEP 包裹
   → 产生 ~256B wrapped key
6. 拼接最终密文：
   base64(wrappedKey) + "." + base64(iv) + "." + base64(aesGcmCiphertext)
```

### encryptedContentDetail 解密流程（后端）

```
1. 按 "." 分割得到三段 base64
2. base64 解码三段 → wrappedKey (256B), iv (12B), aesGcmCiphertext
3. 根据请求中的 keyId 查询 sys_asymmetric_keys，获取对应 RSA-2048 私钥
4. 用 RSA-OAEP 私钥解密 wrappedKey → AES-256 原始密钥（32B）
5. 用 AES-256-GCM + IV 解密 aesGcmCiphertext（需验证末尾 16B auth tag）
6. UTF-8 解码 → 原文
```

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
- 后端解密失败（解密三段式混合密文任一环节失败）时返回 `400 (DECRYPT_FAILED)`，并附带 `"message": "解密失败，请重新获取公钥再试"`
- auth tag 验证失败时同样返回 `400 (DECRYPT_FAILED)`

### 验收要点

- [ ] 内容详尽时返回 `suggestions: null` 并给出合理等级与解释
- [ ] 内容简略/缺失关键信息时返回非空的 `suggestions`
- [ ] `explanation` 始终非空，与 `level` 逻辑一致
- [ ] `level` 始终为 S/A/B/C/D/E 合法值
- [ ] 解密失败（密钥不匹配、auth tag 无效、格式错误）时返回 400
- [ ] 任意长度原文（含中文 Unicode 超过 190B）可正确加解密

---

## 4) 项目卡片数据模型增量 — 多端点 `projects` 响应新增字段

> **消费方**：`ProjectCard`（所有渲染场景：首页 Feed、个人/团队/机构空间项目列表）  
> **变更类型**：以下端点返回的 `projects` 数组中每个项目对象新增三个可选字段，供 ProjectCard 展示发布人名称与预算区间。

### 涉及的端点

| 端点 | 消费方 | 前端使用场景 |
|------|--------|-------------|
| `GET /feed/home` | `useHomeFeedWidget` / `HomeFeed` | 首页推荐卡片 |
| `GET /feed/projects` | `ProjectFeed` | 项目 Feed 列表 |
| `GET /user-profile/home` | `useUserProfileTabData` / `PersonalHomeTabContent` | 个人空间主页预览 |
| `GET /user-profile/projects` | `useUserProfileTabData` / `PersonalProjectsContent` | 个人空间「项目」Tab |
| `GET /team-profile/home` | `useTeamProfileTabData` / `TeamHomeTabContent` | 团队空间主页预览 |
| `GET /team-profile/projects` | `useTeamProfileTabData` / `TeamProjectsContent` | 团队空间「项目」Tab |
| `GET /entity-profile/home` | `useEntityProfileTabData` / `OrganizationHomeTabContent` | 机构空间主页预览 |
| `GET /entity-profile/projects` | `useEntityProfileTabData` / `OrganizationProjectsContent` | 机构空间「项目」Tab |

### 新增字段（逐个项目对象，非根级）

```json
{
  "publisherName": "张三",
  "amountMin": "5000",
  "amountMax": "20000"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `publisherName` | string \| null | 否 | 项目发布人的显示名称（如 user_profile.displayName），卡片 meta 行展示在 `ownerOrganization` 与 `duration` 之间。缺失/null 时卡片仅展示「公司 · 周期」 |
| `amountMin` | string \| null | 否 | 预算区间最小值（纯数字字符串，如 `"5000"`），卡片右上角等级下方展示。缺失或两端均 null 时不展示预算行 |
| `amountMax` | string \| null | 否 | 预算区间最大值（同上），前端通过 `formatBudgetRange()` 将数字格式化为短字符串（如 `"5k–20k"` / `"1.2M"`） |

### 前端格式化规则（`formatBudgetRange`）

| 原始值范围 | 格式化输出示例 |
|-----------|---------------|
| `>= 1,000,000` | `"1.2M"`（除以 1e6，保留 1 位小数，尾随 .0 省略） |
| `>= 1,000` | `"5k"`（除以 1e3，同上） |
| `< 1,000` | 原数字字符串 |
| 仅 `amountMin` 有值 | `"5k"` |
| `amountMin` + `amountMax` 均存在 | `"5k–20k"` |
| 两端均 null/空 | `"—"`（卡片不展示） |

### 示例响应片段

```json
{
  "code": 200,
  "message": null,
  "data": {
    "projects": [
      {
        "uid": "PRa1b2c3d4e5f",
        "title": "分布式电商平台开发",
        "preview": "构建支持千万级并发的电商系统……",
        "tags": [{ "label": "Java" }, { "label": "微服务" }],
        "category": "COMMERCIAL",
        "ownerOrganization": "字节跳动",
        "publisherName": "张三",
        "publishTime": "2026-07-01T10:00:00Z",
        "level": "B",
        "amountMin": "80000",
        "amountMax": "120000",
        "duration": "60 天",
        "logoSvgUrl": "https://cdn.example.com/logo.svg",
        "status": "OPEN"
      }
    ]
  }
}
```

### 业务规则

- 三个字段均为**可选**：后端未实现时前端自动回退（publisherName 缺省时 meta 行仅展示「公司 · 周期」，amountMin/amountMax 缺省时不渲染预算行）
- `amountMin` / `amountMax` 为纯数字字符串，不含千分位逗号、单位或小数点
- `publisherName` 为空字符串时按 null 处理
- 不影响现有字段（`uid` / `title` / `preview` / `tags` / `category` / `ownerOrganization` / `publishTime` / `level` / `duration` / `logoSvgUrl` / `status` 保持原样）

### 验收要点

- [ ] 首页 Feed 卡片正确展示发布人名称和预算区间
- [ ] 个人/团队/机构空间项目列表卡片正确展示
- [ ] `publisherName` 缺失时卡片仅展示「公司 · 周期」
- [ ] `amountMin` / `amountMax` 双 null 时卡片不展示预算行
- [ ] FormatBudgetRange 在前端正确定格式化 1k / 1M 边界值
- [ ] 旧字段不受影响，卡片外观（除新增内容外）保持不变
