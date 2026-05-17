# UniBridge Admin API 文档

本文档用于对接 `apps/web-admin` 管理端，当前包含：

- 登录 API
- 查询 API（`GET`）
- 新增 API（`POST`）

不包含更新/删除接口（`PUT/PATCH/DELETE`）。

> 基础路径约定：前端 `axios` 默认 `baseURL = /api/v1/admin`（见 `apps/web-admin/src/utils/request.ts`）。  
> 下文所有路径均相对 `/api/v1/admin`。

---

## 01）通用约定

### 01.1）统一响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code=200` 表示业务成功
- `message` 为可读提示，出现错误码时用于填充报错信息
- `data` 为业务数据（对象/列表/分页）

### 01.2）鉴权与权限

- 登录接口（`POST /admin/login`）不需要 token
- 除登录外，所有接口都需要，用于鉴权：

```http
Authorization: Bearer <admin_token>
```

权限等级（`system_admin.auth_level`）：

| auth_level | 权限说明 |
| --- | --- |
| `1` | 普通审计 |
| `2` | 高级管理 |
| `3` | 超级管理员 |

后端处理要求（必须）：

- 每个业务接口在返回参数前先做 token 校验
- 每个业务接口在返回参数前再做权限校验
- token错误，鉴权失败返回 `401`
- 权限不足返回 `403`

权限规则（当前业务）：

- 后台手动新增数据，如在表格中新增主体信息，新增用户时（管理端 `POST`）：`auth_level >= 2`
- 用户提交主体认证 or 身份认证申请：不要求高级管理（用户态提交）
- 主体认证审核：普通审计及以上可处理（`auth_level >= 1`）
- 身份认证审核：实名认证使用自动化处理，主体/机构认证（除学生外）要求主体负责人使用主体账号通过审核

### 01.3）列表分页参数（推荐）

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码，从 `1` 开始 |
| `pageSize` | number | 每页条数，默认 `20` |
| `sort` | string | 排序字段，目前默认使用id，可选参数：最新用户（id递减排序），上次登录时间（递减排序） |
| `order` | `asc` \| `desc` | 排序方向，默认id递增 |
| `q` | string | 通用关键词 |

---

## 02）管理员登录（system_admin）

数据库表：`system_admin(id, password_hash, auth_level, last_login_at, created_at, updated_at)`

### 02.1）登录

- **Method**：`POST`
- **Path**：`/admin/login`
- **Auth**：否

#### Request Body

```json
{
  "adminId": "admin_master",
  "password_hash": "<前端哈希后的密码>"
}
```

#### Response Data

```json
{
  "token": "<jwt_token>",
  "auth_level": 3,
  "admin_id": "admin_master"
}
```

> 安全要求：严禁返回 `password_hash`。登录成功后更新 `last_login_at`。

### 02.2）获取当前管理员信息（目前没用，不实现）

- **Method**：`GET`
- **Path**：`/admin/me`
- **Auth**：是

---

## 03）主体（entity）

数据库字段：  
`id, name, type, balance, intro, last_login_at, audit_status, audit_admin_id, audited_at, created_at, updated_at`

### 03.1）主体列表

- **Method**：`GET`
- **Path**：`/entities/list`
- **Auth**：是（`auth_level >= 1`）

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 否 | `ENTERPRISE` \| `UNIVERSITY` |
| `audit_status` | string | 否 | `PENDING` \| `APPROVED` \| `REJECTED` |
| `q` | string | 否 | 匹配主体名称 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 1,
  "name": "浙江大学",
  "type": "UNIVERSITY",
  "balance": "50000.00",
  "audit_status": "APPROVED",
  "audit_admin_id": "0001-陈晨",
  "audited_at": "2026-01-10 09:30:00",
  "created_at": "2026-01-10 00:00:00",
  "updated_at": "2026-04-18 08:10:00",
  "last_login_at": "2026-01-10 09:30:00"
}
```

### 03.2）主体详情

- **Method**：`GET`
- **Path**：`/entities/{id}`
- **Auth**：是（`auth_level >= 1`）

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 主体 ID（`entity.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "name": "浙江大学",
  "type": "UNIVERSITY",
  "balance": "50000.00",
  "intro": "以科研与产学研合作为核心，提供技术研发与人才培养支撑。",
  "audit_status": "APPROVED",
  "audit_admin_id": "0001-陈晨",
  "audited_at": "2026-01-10 09:30:00",
  "created_at": "2026-01-10 00:00:00",
  "updated_at": "2026-04-18 08:10:00",
  "last_login_at": "2026-04-18 08:10:00"
}
```

### 03.3）主体新增（管理员(>=2)手动）

- **Method**：`POST`
- **Path**：`/entities`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "name": "复旦大学",
  "type": "UNIVERSITY"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "intro": "以科研与产学研合作为核心，提供技术研发与人才培养支撑。"
}
```

> 其前端提交表单时仅提供上述json中的内容，后端需要对数据库中的'id, balance, audit_status, audit_admin_id, audited_at, created_at, updated_at'自动填充，默认balance = 0，audit_status = APPROVED（管理员自行添加视为审核已通过），audited_at = created_at = updated_at = 当前服务器时间，audit_admin_id = 当前jwt的管理员ID
> 另外，`intro` 默认空（`null`），`last_login_at` 默认空（`null`）。

### 03.4）主体审核（管理员(>=1)，目前没有，不实现）

- **Method**：`POST`
- **Path**：`/entities/{id}/audit`
- **Auth**：是（`auth_level >= 1`）

#### Request Body

```json
{
  "audit_status": "APPROVED",
  "audit_admin_id": "0001-陈晨"
}
```

---

## 04）用户与档案（userProfile + user_profile）

### 04.1）用户列表（含档案）

- **Method**：`GET`
- **Path**：`/users/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `q` | string | 否 | 匹配手机号或姓名 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |
| `sort` | string | 否 | `id` \| `last_login_at` |
| `order` | string | 否 | `asc` \| `desc` |

#### Response `data.list[]`

```json
{
    "id": 1,
    "phone": "13800138000",
    "real_name": "张三",
    "current_entity_name": "浙江大学",
    "bio_data": ["React", "Node.js", "摄影"],
    "career_data": ["学生", "计算机科学与技术"],
    "last_login_at": "2026-04-19 09:12:00",
    "created_at": "2026-04-01 10:00:00",
    "updated_at": "2026-04-19 09:12:00"
}
```
返回：`userProfile` 字段 + `profile` 字段，不返回 `password_hash`。

### 04.2）用户详情

- **Method**：`GET`
- **Path**：`/users/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 用户 ID（`userProfile.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "phone": "13800138000",
  "real_name": "张三",
  "current_entity_name": "浙江大学",
  "career_data": ["学生", "计算机科学与技术"],
  "bio_data": ["React", "Node.js", "摄影"],
  "intro": "擅长前端与服务端协同开发，关注工程化与性能优化。",
  "last_login_at": "2026-04-19 09:12:00",
  "created_at": "2026-04-01 10:00:00",
  "updated_at": "2026-04-19 09:12:00"
}
```

### 04.3）用户新增（管理员(>=2)手动）

- **Method**：`POST`
- **Path**：`/users`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "phone": "13900000000",
  "password_hash": "<hash>"
}
```

（p.s. 密码在前端的表单中是明文的形式，会自动做SHA256加密）

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "profile": {
    "real_name": "张三",
    "current_entity_name": "浙江大学",
    "bio_data": ["React", "Node.js"],
    "career_data": ["学生", "计算机科学与技术"],
    "intro": "擅长前端与服务端协同开发。"
  }
}
```

> 后端自动填充规则：
> - `userProfile.created_at`、`userProfile.updated_at` 使用服务器时间
> - `userProfile.last_login_at` 默认空（`null`）
> - `user_profile` 自动创建并默认：`real_name/current_entity_name/intro = null`，`bio_data/career_data = []`

---

## 05）实验室（laboratory）

### 05.1）实验室列表

- **Method**：`GET`
- **Path**：`/laboratories/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entity_id` | number | 否 | 按所属主体筛选 |
| `mentor_id` | number | 否 | 按导师筛选 |
| `q` | string | 否 | 匹配实验室名称 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{ 
    "id": 1, 
    "lab_name": "AI 视觉实验室", 
    "entity_id": 1, 
    "entity_name": "浙江大学",
    "mentor_id": 10001, 
    "mentor_name": "王教授", 
    "created_at": "2026-01-15 10:00:00", 
    "updated_at": "2026-04-18 09:00:00" 
}
```
联表返回：`entity_name`、`mentor_name`。
说明：列表接口不返回 `tag`、`intro`，点击名称进入详情后再返回。

### 05.2）实验室详情

- **Method**：`GET`
- **Path**：`/laboratories/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 实验室 ID（`laboratory.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

说明：实验室成员列表并入实验室详情返回，前端只在查看实验室详情时拉取该实验室成员信息，不再额外调用独立的“实验室成员 list”接口。
返回字段说明：`members_list` 为该实验室下成员列表。

```json
{
  "id": 1,
  "lab_name": "AI 视觉实验室",
  "entity_id": 1,
  "entity_name": "浙江大学",
  "mentor_id": 10001,
  "mentor_name": "王教授",
  "tag": ["计算机视觉", "深度学习", "MLOps"],
  "intro": "聚焦视觉智能模型研发与产业落地，支持算法训练、推理优化和工程部署。",
  "created_at": "2026-01-15 10:00:00",
  "updated_at": "2026-04-18 09:00:00",
  "members_list": [
    {
      "user_id": 1002,
      "user_name": "张三",
      "phone": "13800138000",
      "business_role": "STUDENT",
      "auth_status": "APPROVED"
    },
    {
      "user_id": 1003,
      "user_name": "李四",
      "phone": "13912345678",
      "business_role": "MENTOR",
      "auth_status": "APPROVED"
    }
  ]
}
```

成员数据来源建议：`user_auth_link`（`lab_id = {id}`）联表 `userProfile` / `user_profile`。

### 05.3）实验室新增

- **Method**：`POST`
- **Path**：`/laboratories`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "entity_name": "浙江大学",
  "mentor_name": "王教授",
  "lab_name": "AI 视觉实验室"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "tag": ["计算机视觉", "深度学习", "MLOps"],
  "intro": "聚焦视觉智能模型研发与产业落地。"
}
```
- 为了方便，前端写入的是中文，后端需要依次对"entity_name", "mentor_name"进行检索（逻辑：在"entity_name"下是否存在"mentor_name"这个人）若不存在目标，则返回{code: 404,message: "目标不存在，请检查输入信息是否正确" }。同样的，created_at, updated_at使用服务器时间。
- `intro` 最长 200 字；`tag` 为技能标签数组。
- 若前端未传 `tag`、`intro`，后端默认：`tag = []`，`intro = null`。

---

## 06）用户认证关联（user_auth_link）（p.s. 这部分主要面向学校导师以及企业工作人员，在管理端中被集成到了user中，不用管，后端管理好数据库中的认证信息就好）

### 06.1）认证关联列表

- **Method**：`GET`
- **Path**：`/userProfile-auth-links/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entity_id` | number | 否 | 按主体筛选 |
| `lab_id` | number | 否 | 按实验室筛选 |
| `business_role` | string | 否 | `PM` \| `MENTOR` \| `FACULTY` \| `STUDENT` |
| `audit_status` | string | 否 | 按审核状态筛选 |
| `q` | string | 否 | 匹配用户名/手机号 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 101,
  "user_id": 10086,
  "user_name": "张三",
  "entity_id": 1,
  "entity_name": "浙江大学",
  "lab_id": 2,
  "lab_name": "AI 视觉实验室",
  "business_role": "STUDENT",
  "audit_status": "APPROVED",
  "created_at": "2026-04-12 10:00:00",
  "updated_at": "2026-04-12 10:30:00"
}
```

### 06.2）认证关联详情

- **Method**：`GET`
- **Path**：`/userProfile-auth-links/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 认证记录 ID（`user_auth_link.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 101,
  "user_id": 10086,
  "user_name": "张三",
  "entity_id": 1,
  "entity_name": "浙江大学",
  "lab_id": 2,
  "lab_name": "AI 视觉实验室",
  "business_role": "STUDENT",
  "audit_status": "APPROVED",
  "created_at": "2026-04-12 10:00:00",
  "updated_at": "2026-04-12 10:30:00"
}
```

### 06.3）用户提交主体认证申请（用户侧）

- **Method**：`POST`
- **Path**：`/userProfile-auth-links/apply`
- **Auth**：用户登录态（不要求高级管理）

```json
{
  "user_id": 10086,
  "entity_id": 1,
  "lab_id": 2,
  "business_role": "STUDENT"
}
```

### 06.4）认证申请审核（管理员）

- **Method**：`POST`
- **Path**：`/userProfile-auth-links/{id}/audit`
- **Auth**：是（`auth_level >= 1`）

```json
{
  "audit_status": "APPROVED",
  "remark": "资料齐全，审核通过"
}
```

---

## 07）团队（team）

### 07.1）团队列表

- **Method**：`GET`
- **Path**：`/teams/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | string | 否 | `ACTIVE` \| `DISBANDED` |
| `leader_id` | number | 否 | 按队长筛选 |
| `q` | string | 否 | 匹配团队名称 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{ 
  "id": 1, 
  "team_name": "AI 图像算法组", 
  "leader_id": 1001, 
  "leader_name": "队长 A", 
  "status": "ACTIVE", 
  "created_at": "2026-03-20 10:00:00",
  "updated_at": "2026-04-18 10:20:00"
}
```
说明：列表接口不返回 `tag`、`intro`，点击名称进入详情后再返回。

### 07.2）团队详情

- **Method**：`GET`
- **Path**：`/teams/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 团队 ID（`team.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

说明：团队成员列表并入团队详情返回，前端只在查看团队详情时拉取该团队成员信息，不再额外调用 `GET /team-members/list`。
返回字段说明：`members_list` 为该团队下成员列表。

```json
{
  "id": 1,
  "team_name": "AI 图像算法组",
  "leader_id": 1001,
  "leader_name": "队长 A",
  "tag": ["PyTorch", "模型部署", "A/B 测试"],
  "intro": "负责图像算法研发、服务化部署与线上效果持续优化。",
  "status": "ACTIVE",
  "created_at": "2026-03-20 10:00:00",
  "updated_at": "2026-04-18 10:20:00",
  "members_list": [
    {
      "team_member_id": 11,
      "user_id": 1002,
      "user_name": "张三",
      "phone": "13800138000",
      "role": "MEMBER",
      "joined_at": "2026-03-22 09:30:00"
    },
    {
      "team_member_id": 12,
      "user_id": 1003,
      "user_name": "李四",
      "phone": "13912345678",
      "role": "PM",
      "joined_at": "2026-03-23 14:10:00"
    }
  ]
}
```

成员数据来源建议：`team_member`（`team_id = {id}`）联表 `userProfile` / `user_profile`。

### 07.3）团队新增（手动）

- **Method**：`POST`
- **Path**：`/teams`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "team_name": "AI 图像算法组",
  "leader_name": "队长A"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "tag": ["PyTorch", "模型部署", "A/B 测试"],
  "intro": "负责图像算法研发、服务化部署与线上效果持续优化。"
}
```
- `intro` 最长 200 字；`tag` 为技能标签数组。
- 若前端未传 `tag`、`intro`，后端默认：`tag = []`，`intro = null`。
- `created_at`、`updated_at` 使用服务器时间。

---

## 08）团队成员（team_member）

### 08.1）成员列表

- **Method**：`GET`
- **Path**：`/team-members/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `team_id` | number | 否 | 按团队筛选 |
| `role` | string | 否 | `LEADER` \| `MEMBER` |
| `q` | string | 否 | 匹配用户名/手机号 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 11,
  "team_id": 1,
  "team_name": "AI 图像算法组",
  "user_id": 1002,
  "user_name": "张三",
  "phone": "13800138000",
  "role": "MEMBER",
  "joined_at": "2026-03-22 09:30:00",
  "created_at": "2026-03-22 09:30:00",
  "updated_at": "2026-03-22 09:30:00"
}
```

### 08.2）成员详情

- **Method**：`GET`
- **Path**：`/team-members/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 团队成员记录 ID（`team_member.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 11,
  "team_id": 1,
  "team_name": "AI 图像算法组",
  "user_id": 1002,
  "user_name": "张三",
  "phone": "13800138000",
  "role": "MEMBER",
  "joined_at": "2026-03-22 09:30:00",
  "created_at": "2026-03-22 09:30:00",
  "updated_at": "2026-03-22 09:30:00"
}
```

### 08.3）成员新增

- **Method**：`POST`
- **Path**：`/team-members`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "team_id": 1,
  "user_id": 1002,
  "role": "MEMBER"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "joined_at": "2026-03-22 09:30:00"
}
```

> 后端自动填充规则：`joined_at`、`created_at`、`updated_at` 使用服务器时间。

---

## 09）商业项目（commercial_project）

### 09.1）商业项目列表

- **Method**：`GET`
- **Path**：`/commercial-projects/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | string | 否 | 按项目状态筛选 |
| `level` | string | 否 | `N` \| `R` \| `SR` \| `SSR` \| `UR` |
| `project_pm_id` | number | 否 | 按发布者筛选 |
| `q` | string | 否 | 匹配项目标题 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 1,
  "title": "企业级大模型私有化部署",
  "project_pm_id": 101,
  "project_pm_name": "张三（PM）",
  "executor_lab_id": 1,
  "executor_lab_name": "AI 视觉实验室",
  "executor_team_id": null,
  "executor_team_name": null,
  "total_budget": "50000.00",
  "level": "SSR",
  "status": "DEVELOPING",
  "published_at": "2026-04-01 10:00:00",
  "updated_at": "2026-04-18 16:00:00"
}
```

建议联表返回：`project_pm_name`、`executor_lab_name`、`executor_team_name`。

### 09.2）商业项目详情

- **Method**：`GET`
- **Path**：`/commercial-projects/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 商业项目 ID（`commercial_project.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "project_pm_id": 101,
  "project_pm_name": "张三（PM）",
  "executor_lab_id": 1,
  "executor_lab_name": "AI 视觉实验室",
  "executor_team_id": null,
  "executor_team_name": null,
  "title": "企业级大模型私有化部署",
  "preview": "项目简述...",
  "tags": ["LLM", "MLOps"],
  "level": "SSR",
  "total_budget": "50000.00",
  "status": "RECRUITING",
  "published_at": "2026-04-01 10:00:00",
  "created_at": "2026-04-01 09:58:12",
  "updated_at": "2026-04-18 16:00:00"
}
```

### 09.3）商业项目新增

- **Method**：`POST`
- **Path**：`/commercial-projects`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "project_pm_id": 101,
  "title": "企业级大模型私有化部署",
  "preview": "项目简述...",
  "total_budget": "50000.00"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "executor_lab_id": 1,
  "executor_team_id": null,
  "tags": ["LLM", "MLOps"],
  "level": "SSR",
  "status": "RECRUITING",
  "published_at": "2026-04-01 10:00:00"
}
```

> 后端自动填充规则：
> - `created_at`、`updated_at`、`published_at` 使用服务器时间
> - `executor_lab_id`、`executor_team_id` 默认 `null`
> - `tags` 默认 `[]`
> - `level` 默认 `N`，`status` 默认 `PENDING`

---

## 10）招募/实践项目（recruitment_project）

### 10.1）列表

- **Method**：`GET`
- **Path**：`/recruitment-projects/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | string | 否 | `OPEN` \| `CLOSED` |
| `type` | string | 否 | `LAB_RECRUIT` \| `TEAM_RECRUIT` \| `CAMPUS_PRACTICE` |
| `creator_id` | number | 否 | 按发起人筛选 |
| `q` | string | 否 | 匹配项目标题 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 2,
  "title": "数学建模竞赛组队",
  "creator_id": 205,
  "creator_name": "钱七",
  "source_lab_id": null,
  "source_lab_name": null,
  "source_team_id": 2,
  "source_team_name": "前端基建小分队",
  "type": "TEAM_RECRUIT",
  "status": "CLOSED",
  "published_at": "2026-04-14 13:30:00",
  "updated_at": "2026-04-16 16:40:00"
}
```

### 10.2）详情

- **Method**：`GET`
- **Path**：`/recruitment-projects/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 招募/实践项目 ID（`recruitment_project.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 2,
  "creator_id": 205,
  "creator_name": "钱七",
  "source_lab_id": null,
  "source_lab_name": null,
  "source_team_id": 2,
  "source_team_name": "前端基建小分队",
  "type": "TEAM_RECRUIT",
  "title": "数学建模竞赛组队",
  "tags": ["建模", "竞赛"],
  "requirement": "熟悉数据建模和 Python",
  "status": "OPEN",
  "published_at": "2026-04-14 13:30:00",
  "created_at": "2026-04-14 13:28:45",
  "updated_at": "2026-04-16 16:40:00"
}
```

### 10.3）新增

- **Method**：`POST`
- **Path**：`/recruitment-projects`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "creator_id": 201,
  "type": "CAMPUS_PRACTICE",
  "title": "校园二手交易平台开发",
  "preview": "项目简略描述"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "source_lab_id": 1,
  "source_team_id": null,
  "tags": ["Web", "校园"],
  "requirement": "熟悉 React / Node.js",
  "status": "OPEN",
  "published_at": "2026-04-12 09:00:00"
}
```

> 后端自动填充规则：
> - `created_at`、`updated_at`、`published_at` 使用服务器时间
> - `source_lab_id`、`source_team_id` 默认 `null`
> - `tags` 默认 `[]`，`requirement` 默认空（`null`）
> - `status` 默认 `OPEN`

---

## 11）里程碑（milestone）

数据库字段：`id, project_id, title, payment_pct, status, created_at, updated_at`  
说明：里程碑不设置管理员审核机制，`status` 表示“项目 PM 与学生 PM 协商状态”。

### 11.1）列表

- **Method**：`GET`
- **Path**：`/milestones/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `project_id` | number | 否 | 按所属项目筛选 |
| `status` | string | 否 | 协商状态筛选 |
| `q` | string | 否 | 匹配里程碑标题 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 1,
  "project_id": 101,
  "project_title": "企业级大模型私有化部署",
  "title": "需求规格说明书评审",
  "payment_pct": "20.00",
  "status": "NEGOTIATING",
  "created_at": "2026-05-01 10:00:00",
  "updated_at": "2026-05-02 09:00:00"
}
```

### 11.2）详情

- **Method**：`GET`
- **Path**：`/milestones/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 里程碑 ID（`milestone.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "project_id": 101,
  "project_title": "企业级大模型私有化部署",
  "title": "需求规格说明书评审",
  "payment_pct": "20.00",
  "status": "NEGOTIATING",
  "created_at": "2026-05-01 10:00:00",
  "updated_at": "2026-05-02 09:00:00"
}
```

### 11.3）新增

- **Method**：`POST`
- **Path**：`/milestones`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "project_id": 101,
  "title": "需求规格说明书评审",
  "payment_pct": 20.0
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "status": "NEGOTIATING"
}
```

> 后端自动填充规则：`status` 默认 `NEGOTIATING`，`created_at`、`updated_at` 使用服务器时间。

---

## 12）任务卡片（task_card）

### 12.1）列表

- **Method**：`GET`
- **Path**：`/task-cards/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `milestone_id` | number | 否 | 按里程碑筛选 |
| `assignee_id` | number | 否 | 按执行人筛选 |
| `status` | string | 否 | `DONE` \| `TODO` |
| `q` | string | 否 | 匹配任务标题 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 1,
  "milestone_id": 1,
  "milestone_title": "需求规格说明书评审",
  "assignee_id": 10,
  "assignee_name": "学生甲",
  "title": "实现登录 API 对接",
  "status": "DONE",
  "created_at": "2026-05-02 10:00:00",
  "updated_at": "2026-05-03 09:00:00"
}
```

### 12.2）详情

- **Method**：`GET`
- **Path**：`/task-cards/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 任务卡 ID（`task_card.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "milestone_id": 1,
  "milestone_title": "需求规格说明书评审",
  "assignee_id": 10,
  "assignee_name": "学生甲",
  "title": "实现登录 API 对接",
  "content": "完成管理员登录前后端联调",
  "status": "TODO",
  "created_at": "2026-05-02 10:00:00",
  "updated_at": "2026-05-03 09:00:00"
}
```

### 12.3）新增

- **Method**：`POST`
- **Path**：`/task-cards`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "milestone_id": 1,
  "title": "实现登录 API 对接"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "assignee_id": 10,
  "content": "完成管理员登录前后端联调",
  "status": "TODO"
}
```

> 后端自动填充规则：
> - `assignee_id` 默认 `null`
> - `content` 默认空（`null`）
> - `status` 默认 `TODO`
> - `created_at`、`updated_at` 使用服务器时间

---

## 13）成就归档（achievement_archive）

### 13.1）列表

- **Method**：`GET`
- **Path**：`/achievement-archives/list`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `user_id` | number | 否 | 按贡献用户筛选 |
| `source_project_id` | number | 否 | 按原项目筛选 |
| `q` | string | 否 | 匹配脱敏项目名或技术标签 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": 1,
  "masked_project_name": "某大型分布式电商系统",
  "user_id": 5,
  "user_name": "张三",
  "source_project_id": 1,
  "source_project_title": "企业级大模型私有化部署",
  "technical_tags": ["Redis", "SpringCloud"],
  "completed_at": "2026-03-20 18:00:00",
  "updated_at": "2026-03-21 09:30:00"
}
```

### 13.2）详情

- **Method**：`GET`
- **Path**：`/achievement-archives/{id}`
- **Auth**：是

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 成就归档 ID（`achievement_archive.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": 1,
  "user_id": 5,
  "user_name": "张三",
  "source_project_id": 1,
  "source_project_title": "企业级大模型私有化部署",
  "masked_project_name": "某大型分布式电商系统",
  "task_description": "负责核心模块重构与性能优化",
  "technical_tags": ["Redis", "SpringCloud"],
  "completed_at": "2026-03-20 18:00:00",
  "created_at": "2026-03-20 18:10:00",
  "updated_at": "2026-03-21 09:30:00"
}
```

### 13.3）新增

- **Method**：`POST`
- **Path**：`/achievement-archives`
- **Auth**：是（`auth_level >= 2`）

#### Request Body（前端必填）

```json
{
  "user_id": 5,
  "masked_project_name": "某大型分布式电商系统"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "source_project_id": 1,
  "task_description": "负责核心模块重构与性能优化",
  "technical_tags": ["Redis", "SpringCloud"],
  "completed_at": "2026-03-20 18:00:00"
}
```

> 后端自动填充规则：
> - `source_project_id` 默认 `null`
> - `task_description` 默认空（`null`）
> - `technical_tags` 默认 `[]`
> - `completed_at`、`created_at`、`updated_at` 使用服务器时间

---

## 14）系统管理员（system_admin）

### 14.1）管理员列表

- **Method**：`GET`
- **Path**：`/system-admins/list`
- **Auth**：是（建议 `auth_level >= 3`）

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Query（建议）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `q` | string | 否 | 匹配管理员账号 |
| `auth_level` | number | 否 | 按权限等级筛选 |
| `page` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数，默认 20 |

#### Response `data.list[]`

```json
{
  "id": "admin_master",
  "auth_level": 3,
  "last_login_at": "2026-04-18 10:20:00",
  "created_at": "2026-01-01 00:00:00",
  "updated_at": "2026-04-18 10:20:00"
}
```

### 14.2）管理员详情

- **Method**：`GET`
- **Path**：`/system-admins/{id}`
- **Auth**：是（建议 `auth_level >= 3`）

#### Request

- **Header**：`Authorization: Bearer <admin_token>`
- **Path Params**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 管理员账号 ID（`system_admin.id`） |

- **Query**：无
- **Request Body**：无

#### Response `data`

```json
{
  "id": "0002-李伟",
  "auth_level": 2,
  "last_login_at": "2026-04-18 10:20:00",
  "created_at": "2026-01-10 00:00:00",
  "updated_at": "2026-04-18 10:20:00"
}
```

> 安全要求：管理员详情接口严禁返回 `password_hash`。

### 14.3）管理员新增

- **Method**：`POST`
- **Path**：`/system-admins`
- **Auth**：是（建议 `auth_level >= 3`）

#### Request Body（前端必填）

```json
{
  "id": "0002-李伟",
  "password_hash": "<hash>"
}
```

#### Request Body（可选扩展字段，后端不强制）

```json
{
  "auth_level": 1
}
```

> 后端自动填充规则：`last_login_at` 默认空（`null`），`created_at`、`updated_at` 使用服务器时间。

---

## 15）当前不包含

- `PUT / PATCH / DELETE`（更新与删除）
- 批量导入导出

---

## 16）与前端映射

- 登录封装：`apps/web-admin/src/api/loginAPI.ts` → `POST /admin/login`
- 请求实例：`apps/web-admin/src/utils/request.ts` → 默认 `baseURL=/api/v1`
