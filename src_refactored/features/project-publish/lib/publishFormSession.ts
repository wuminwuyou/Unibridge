// 01）发布项目会话持久化（sessionStorage）
import {
  migrateLegacyContentLongtext,
  type ContentLongtext,
} from '@entities/editor/lib/contentLongtext'
import type { MarkdownContentChangeMeta } from '@entities/editor/model/types'
import { isProjectResourceUid } from '@shared/api/resourceUid'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import { createDefaultPublishProjectDraft } from '../constants/publishOptions'
import type { PublishProjectFormDraft } from '../model/types'

// 02）发布项目会话存储键（PUBLISH_PROJECT_SESSION_KEY）
const PUBLISH_PROJECT_SESSION_KEY = 'unibridge.publish-project.session'

// 03）发布项目会话数据（PublishProjectSession）
export interface PublishProjectSession {
  draft: PublishProjectFormDraft
  descriptionMeta: MarkdownContentChangeMeta | null
  descriptionContent: ContentLongtext
  projectUid?: ProjectResourceUid | null
  keepForRestore?: boolean
}

// 04）在线编辑器往返时恢复的表单快照（PublishProjectFormRestore）
export interface PublishProjectFormRestore {
  draft: PublishProjectFormDraft
  descriptionMeta: MarkdownContentChangeMeta | null
  descriptionContent: ContentLongtext
  projectUid: ProjectResourceUid | null
}

// 05）解析会话中的需求说明存储（resolvePublishProjectDescriptionContent）
function resolvePublishProjectDescriptionContent(
  parsed: Partial<PublishProjectSession> & { descriptionEditorType?: ContentLongtext['editorType'] },
  draft: PublishProjectFormDraft,
): ContentLongtext {
  if (
    parsed.descriptionContent &&
    (parsed.descriptionContent.editorType === 'MARKDOWN' || parsed.descriptionContent.editorType === 'RICHTEXT') &&
    typeof parsed.descriptionContent.longtext === 'string'
  ) {
    return parsed.descriptionContent
  }

  return migrateLegacyContentLongtext(draft.description, parsed.descriptionEditorType ?? 'MARKDOWN')
}

// 06）读取发布项目会话（loadPublishProjectSession）
export function loadPublishProjectSession(): PublishProjectSession | null {
  try {
    const raw = sessionStorage.getItem(PUBLISH_PROJECT_SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PublishProjectSession> & {
      descriptionEditorType?: ContentLongtext['editorType']
      projectId?: unknown
    }
    if (!parsed?.draft || typeof parsed.draft !== 'object') return null

    const draft = { ...createDefaultPublishProjectDraft(), ...parsed.draft }
    if (draft.channel === 'campus' && !draft.campusRecruitType) {
      draft.campusRecruitType = 'LAB_RECRUIT'
    }
    const descriptionContent = resolvePublishProjectDescriptionContent(parsed, draft)
    const projectUid = isProjectResourceUid(parsed.projectUid) ? parsed.projectUid : null

    return {
      draft: { ...draft, description: descriptionContent.longtext },
      descriptionMeta: parsed.descriptionMeta ?? null,
      descriptionContent,
      projectUid,
      keepForRestore: parsed.keepForRestore === true,
    }
  } catch {
    return null
  }
}

// 07）保存发布项目会话（savePublishProjectSession）
export function savePublishProjectSession(session: PublishProjectSession): void {
  try {
    const payload: PublishProjectSession = {
      draft: { ...session.draft, description: session.descriptionContent.longtext },
      descriptionMeta: session.descriptionMeta,
      descriptionContent: session.descriptionContent,
      projectUid: session.projectUid ?? null,
      keepForRestore: session.keepForRestore === true,
    }
    sessionStorage.setItem(PUBLISH_PROJECT_SESSION_KEY, JSON.stringify(payload))
  } catch { /* 存储不可用时静默降级 */ }
}

// 08）清除发布项目本地缓存（clearPublishProjectSession）
export function clearPublishProjectSession(): void {
  try { sessionStorage.removeItem(PUBLISH_PROJECT_SESSION_KEY) } catch { /* 静默降级 */ }
}

// 09）创建恢复快照
export function createPublishProjectFormRestore(
  draft: PublishProjectFormDraft,
  descriptionMeta: MarkdownContentChangeMeta | null,
  descriptionContent: ContentLongtext,
  projectUid: ProjectResourceUid | null,
): PublishProjectFormRestore {
  return {
    draft: { ...draft, description: descriptionContent.longtext },
    descriptionMeta,
    descriptionContent,
    projectUid,
  }
}
