// 01）笔记标注 / 学习笔记 Feature — Services
import { createNote } from '../../../entities/note/api/noteApi'

// 02）创建关联学习笔记
export async function createLearningNote(params: {
  parentContentTypeCode: string
  title: string
  content: string
  tags: string[]
  coverUrl: string
}) {
  return createNote({
    publishAction: 'PUBLISH',
    title: params.title,
    summary: '',
    contentType: '图文',
    content: params.content,
    tags: params.tags,
    coverUrl: params.coverUrl,
    parentContentTypeCode: params.parentContentTypeCode,
    visibility: 'PUBLIC',
  })
}
