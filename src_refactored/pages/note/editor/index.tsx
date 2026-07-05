// 01）笔记编辑页（NoteEditorPage）
import { useSearchParams } from 'react-router-dom'
import TopNavbar from '@widgets/top-navbar'
import type { NoteEditorRouteType } from '@features/note-editor-entry'

// 02）解析编辑页 type query（resolveEditorRouteType）
function resolveEditorRouteType(type: string | null): NoteEditorRouteType | null {
  if (type === 'article' || type === 'video') {
    return type
  }
  return null
}

function NoteEditorPage() {
  const [searchParams] = useSearchParams()
  const routeType = resolveEditorRouteType(searchParams.get('type'))
  const noteUid = searchParams.get('uid')

  return (
    <>
      <TopNavbar />
      <div className="detail-page" style={{ paddingTop: '64px' }}>
        <div className="detail-page-main">
          <div className="detail-card">
            <h2>编辑笔记</h2>
            {routeType ? (
              <p style={{ color: 'var(--text-soft)', marginTop: '8px' }}>
                当前类型：<strong>{routeType === 'article' ? '图文笔记' : '视频笔记'}</strong>
                {noteUid ? ` · uid=${noteUid}` : ''}
              </p>
            ) : (
              <p style={{ color: 'var(--text-soft)', marginTop: '8px' }}>
                缺少笔记类型参数，请从顶部导航「发布 → 发布笔记」选择类型后进入。
              </p>
            )}
            <div className="auth-form" style={{ gap: '14px', marginTop: '14px' }}>
              <div className="auth-floating-field has-value">
                <input type="text" id="note-title" placeholder=" " disabled={!routeType} />
                <label htmlFor="note-title">笔记标题</label>
              </div>
              <div className="auth-floating-field has-value">
                <textarea
                  id="note-content"
                  placeholder=" "
                  disabled={!routeType}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    borderRadius: '12px',
                    border: '1px solid #dbe3f3',
                    padding: '12px',
                  }}
                />
                <label htmlFor="note-content" style={{ position: 'static' }}>
                  正文内容（Markdown）
                </label>
              </div>
              <button type="button" className="auth-submit-button" disabled={!routeType}>
                保存笔记
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NoteEditorPage
