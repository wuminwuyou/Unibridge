import { normalizeUserResourceUid } from '../resourceUid'
import { readRecordField, readRecordNumber, readRecordString } from '../recordFieldUtils'
import type {
  EntityProfileHomeData,
  EntityProfileMemberDto,
  EntityProfileMembersData,
  EntityProfileNotesData,
  EntityProfileProjectsData,
  EntityProfileSpaceData,
  EntityProfileTeamPreviewDto,
  EntityProfileTeamsData,
} from './types'

// 01）归一化机构团队预览项（normalizeEntityProfileTeamPreviewDto）
function normalizeEntityProfileTeamPreviewDto(
  raw: EntityProfileTeamPreviewDto & Record<string, unknown>,
): EntityProfileTeamPreviewDto {
  return {
    teamUid: readRecordString(raw, 'teamUid', { snakeKey: 'team_uid' }) ?? raw.teamUid ?? '',
    name: readRecordString(raw, 'name') ?? raw.name ?? '',
    description: readRecordString(raw, 'description', { nullable: true }) ?? raw.description ?? null,
    logoUrl: readRecordString(raw, 'logoUrl', { nullable: true, snakeKey: 'logo_url' }) ?? raw.logoUrl ?? null,
    memberCount: readRecordNumber(raw, 'memberCount', raw.memberCount ?? 0, 'member_count'),
  }
}

// 02）归一化机构人员项（normalizeEntityProfileMemberDto）
function normalizeEntityProfileMemberDto(
  raw: EntityProfileMemberDto & Record<string, unknown>,
): EntityProfileMemberDto {
  const uid =
    normalizeUserResourceUid(raw) ??
    readRecordString(raw, 'uid') ??
    readRecordString(raw, 'userUid', { snakeKey: 'user_uid' }) ??
    undefined

  return {
    uid,
    userUid: uid,
    nickname: readRecordString(raw, 'nickname') ?? raw.nickname ?? '',
    realName: readRecordString(raw, 'realName', { nullable: true, snakeKey: 'real_name' }) ?? raw.realName ?? null,
    role: (readRecordString(raw, 'role') ?? raw.role ?? 'STUDENT') as EntityProfileMemberDto['role'],
    avatarUrl: readRecordString(raw, 'avatarUrl', { nullable: true, snakeKey: 'avatar_url' }) ?? raw.avatarUrl ?? null,
    level: readRecordString(raw, 'level', { nullable: true }) ?? raw.level ?? null,
  }
}

// 03）归一化机构空间页壳（normalizeEntityProfileSpaceData）
/**
 * 函数名：normalizeEntityProfileSpaceData
 * 功能：归一化 GET /entity-profile/space 响应，兼容 snake_case 与嵌套 coreProfile。
 * 输入：
 * - raw：接口原始 data
 * 输出：
 * - 返回值：EntityProfileSpaceData
 * - 副作用：无
 */
export function normalizeEntityProfileSpaceData(
  raw: EntityProfileSpaceData & Record<string, unknown>,
): EntityProfileSpaceData {
  const coreProfileRaw =
    (readRecordField<Record<string, unknown>>(raw, 'coreProfile', 'core_profile') ??
      (raw.coreProfile as Record<string, unknown> | undefined)) ??
    {}

  const extendedProfileRaw =
    (readRecordField<Record<string, unknown>>(raw, 'extendedProfile', 'extended_profile') ??
      (raw.extendedProfile as Record<string, unknown> | undefined)) ??
    {}

  const teamsPreviewRaw =
    readRecordField<unknown[]>(raw, 'teamsPreview', 'teams_preview') ??
    raw.teamsPreview ??
    []

  const membersPreviewRaw =
    readRecordField<unknown[]>(raw, 'membersPreview', 'members_preview') ??
    raw.membersPreview ??
    []

  const infoRowsRaw = readRecordField<unknown[]>(raw, 'infoRows', 'info_rows') ?? raw.infoRows ?? []

  return {
    entityCode:
      readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ??
      readRecordString(coreProfileRaw, 'entityCode', { snakeKey: 'entity_code' }) ??
      raw.entityCode,
    coreProfile: {
      entityCode:
        readRecordString(coreProfileRaw, 'entityCode', { snakeKey: 'entity_code' }) ??
        raw.coreProfile?.entityCode ??
        '',
      name: readRecordString(coreProfileRaw, 'name') ?? raw.coreProfile?.name ?? '',
      intro: readRecordString(coreProfileRaw, 'intro') ?? raw.coreProfile?.intro ?? '',
      location: readRecordString(coreProfileRaw, 'location') ?? raw.coreProfile?.location ?? '',
      type: (readRecordString(coreProfileRaw, 'type') ?? raw.coreProfile?.type ?? 'ENTERPRISE') as EntityProfileSpaceData['coreProfile']['type'],
      logoUrl:
        readRecordString(coreProfileRaw, 'logoUrl', { nullable: true, snakeKey: 'logo_url' }) ??
        raw.coreProfile?.logoUrl ??
        null,
      bannerUrl:
        readRecordString(coreProfileRaw, 'bannerUrl', { nullable: true, snakeKey: 'banner_url' }) ??
        raw.coreProfile?.bannerUrl ??
        null,
      teamCount: readRecordNumber(coreProfileRaw, 'teamCount', raw.coreProfile?.teamCount ?? 0, 'team_count'),
    },
    extendedProfile: {
      announcement:
        readRecordString(extendedProfileRaw, 'announcement') ?? raw.extendedProfile?.announcement ?? '',
    },
    teamsPreview: (teamsPreviewRaw as Array<EntityProfileTeamPreviewDto & Record<string, unknown>>).map(
      normalizeEntityProfileTeamPreviewDto,
    ),
    membersPreview: (membersPreviewRaw as Array<EntityProfileMemberDto & Record<string, unknown>>).map(
      normalizeEntityProfileMemberDto,
    ),
    infoRows: (infoRowsRaw as Array<{ label: string; value: string }>).map((row) => ({
      label: row.label,
      value: row.value,
    })),
  }
}

// 04）归一化机构主页（normalizeEntityProfileHomeData）
export function normalizeEntityProfileHomeData(
  raw: EntityProfileHomeData & Record<string, unknown>,
): EntityProfileHomeData {
  const teamsRaw = readRecordField<unknown[]>(raw, 'teams') ?? raw.teams ?? []
  const membersRaw = readRecordField<unknown[]>(raw, 'members') ?? raw.members ?? []
  const projectsRaw = readRecordField<unknown[]>(raw, 'projects') ?? raw.projects ?? []
  const notesRaw = readRecordField<unknown[]>(raw, 'notes') ?? raw.notes ?? []

  return {
    entityCode: readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ?? raw.entityCode,
    teams: (teamsRaw as Array<EntityProfileTeamPreviewDto & Record<string, unknown>>).map(
      normalizeEntityProfileTeamPreviewDto,
    ),
    members: (membersRaw as Array<EntityProfileMemberDto & Record<string, unknown>>).map(
      normalizeEntityProfileMemberDto,
    ),
    projects: projectsRaw as EntityProfileHomeData['projects'],
    notes: notesRaw as EntityProfileHomeData['notes'],
    teamTotal: readRecordNumber(raw, 'teamTotal', raw.teamTotal ?? teamsRaw.length, 'team_total'),
    memberTotal: readRecordNumber(raw, 'memberTotal', raw.memberTotal ?? membersRaw.length, 'member_total'),
    projectTotal: readRecordNumber(raw, 'projectTotal', raw.projectTotal ?? projectsRaw.length, 'project_total'),
    noteTotal: readRecordNumber(raw, 'noteTotal', raw.noteTotal ?? notesRaw.length, 'note_total'),
  }
}

// 05）归一化机构实验室列表（normalizeEntityProfileTeamsData）
export function normalizeEntityProfileTeamsData(
  raw: EntityProfileTeamsData & Record<string, unknown>,
): EntityProfileTeamsData {
  const teamsRaw = readRecordField<unknown[]>(raw, 'teams') ?? raw.teams ?? []

  return {
    entityCode: readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ?? raw.entityCode,
    teams: (teamsRaw as Array<EntityProfileTeamPreviewDto & Record<string, unknown>>).map(
      normalizeEntityProfileTeamPreviewDto,
    ),
    total: readRecordNumber(raw, 'total', raw.total ?? teamsRaw.length),
    page: readRecordNumber(raw, 'page', raw.page ?? 1),
    pageSize: readRecordNumber(raw, 'pageSize', raw.pageSize ?? 20, 'page_size'),
  }
}

// 06）归一化机构人员列表（normalizeEntityProfileMembersData）
export function normalizeEntityProfileMembersData(
  raw: EntityProfileMembersData & Record<string, unknown>,
): EntityProfileMembersData {
  const membersRaw = readRecordField<unknown[]>(raw, 'members') ?? raw.members ?? []

  return {
    entityCode: readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ?? raw.entityCode,
    members: (membersRaw as Array<EntityProfileMemberDto & Record<string, unknown>>).map(
      normalizeEntityProfileMemberDto,
    ),
    total: readRecordNumber(raw, 'total', raw.total ?? membersRaw.length),
    page: readRecordNumber(raw, 'page', raw.page ?? 1),
    pageSize: readRecordNumber(raw, 'pageSize', raw.pageSize ?? 20, 'page_size'),
  }
}

// 07）归一化机构项目列表（normalizeEntityProfileProjectsData）
export function normalizeEntityProfileProjectsData(
  raw: EntityProfileProjectsData & Record<string, unknown>,
): EntityProfileProjectsData {
  const projectsRaw = readRecordField<unknown[]>(raw, 'projects') ?? raw.projects ?? []

  return {
    entityCode: readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ?? raw.entityCode,
    projects: projectsRaw as EntityProfileProjectsData['projects'],
    total: readRecordNumber(raw, 'total', raw.total ?? projectsRaw.length),
    page: readRecordNumber(raw, 'page', raw.page ?? 1),
    pageSize: readRecordNumber(raw, 'pageSize', raw.pageSize ?? 20, 'page_size'),
  }
}

// 08）归一化机构笔记列表（normalizeEntityProfileNotesData）
export function normalizeEntityProfileNotesData(
  raw: EntityProfileNotesData & Record<string, unknown>,
): EntityProfileNotesData {
  const notesRaw = readRecordField<unknown[]>(raw, 'notes') ?? raw.notes ?? []

  return {
    entityCode: readRecordString(raw, 'entityCode', { snakeKey: 'entity_code' }) ?? raw.entityCode,
    notes: notesRaw as EntityProfileNotesData['notes'],
    total: readRecordNumber(raw, 'total', raw.total ?? notesRaw.length),
    page: readRecordNumber(raw, 'page', raw.page ?? 1),
    pageSize: readRecordNumber(raw, 'pageSize', raw.pageSize ?? 20, 'page_size'),
  }
}
