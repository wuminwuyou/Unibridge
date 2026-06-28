// 01）空间页壳 Widget（profile-space）
// 个人/团队/机构共用页壳

import { useParams } from 'react-router-dom'

function ProfileSpaceWidget() {
  const params = useParams<{ profileTab?: string; teamUid?: string; teamTab?: string; entityCode?: string; orgTab?: string }>()

  const title = params.entityCode ? `机构空间：${params.entityCode}` : params.teamUid ? `团队空间：${params.teamUid}` : '个人空间'

  return (
    <div className="profile-space-widget">
      <div className="profile-space-widget__hero">
        <div className="hero-avatar" />
        <h1>{title}</h1>
        <p className="hero-subtitle" style={{ color: 'var(--text-soft)' }}>重构中…</p>
      </div>
      <div className="profile-space-widget__tabs">
        <span className="tab active">主页</span>
        <span className="tab">项目</span>
        <span className="tab">笔记</span>
      </div>
      <div className="profile-space-widget__content">
        <p style={{ color: 'var(--text-soft)' }}>空间内容重构中…</p>
      </div>
    </div>
  )
}

export default ProfileSpaceWidget
