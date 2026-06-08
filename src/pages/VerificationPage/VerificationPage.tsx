import { UserCheck, Search, ArrowLeft, ArrowRight, CheckCircle2, Building2, GraduationCap, Briefcase, IdCard } from 'lucide-react'
import TopNavbar from '../../layout/TopNavbar'
import { useVerificationPage } from './useVerificationPage'
import type { EntitySearchItem } from '../../api/verification/types'
import '../../styles/OrganizationVerificationPage.css'
import './VerificationPage.css'

function VerificationPage() {
  const form = useVerificationPage()
  return (
    <div className="organization-verification-page verification-page">
      <TopNavbar />
      <main className="organization-verification-page__main" aria-label="认证">
        <div className="organization-verification-page__card verification-page__card">
          {form.phase === 'idle' || form.phase === 'face-init' ? <PhaseOneFace form={form} /> : null}
          {form.phase === 'face-verify' && form.faceUrl ? <PhaseOneVerify form={form} /> : null}
          {form.phase === 'face-done' ? <PhaseOneDone form={form} /> : null}
          {form.phase === 'org-select' ? <PhaseTwoOrg form={form} /> : null}
        </div>
      </main>
    </div>
  )
}

function PhaseOneFace({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <div className="vp-phase">
      <header className="vp-phase__header">
        <div className="vp-phase__icon vp-phase__icon--blue"><UserCheck size={22} strokeWidth={2} /></div>
        <div><h2>实名身份认证</h2><p className="vp-phase__desc">填写真实姓名与身份证号，通过腾讯云人脸核身验证。</p></div>
      </header>
      {form.errorMessage ? <div className="vp-error" role="alert">{form.errorMessage}</div> : null}
      <form className="vp-form" onSubmit={(e) => { e.preventDefault(); void form.startFaceVerification() }}>
        <div className="vp-field">
          <label htmlFor="vp-realname" className="vp-label">真实姓名</label>
          <input id="vp-realname" type="text" className="vp-input" value={form.realName}
            onChange={(e) => { form.setRealName(e.target.value); form.clearError() }}
            placeholder="请输入身份证上的姓名" disabled={form.isSubmitting} autoComplete="name" />
        </div>
        <div className="vp-field">
          <label htmlFor="vp-idcard" className="vp-label">身份证号</label>
          <input id="vp-idcard" type="text" className="vp-input" value={form.idCard}
            onChange={(e) => { form.setIdCard(e.target.value); form.clearError() }}
            placeholder="请输入 18 位身份证号" maxLength={18} disabled={form.isSubmitting} autoComplete="off" />
        </div>
        <button type="submit" className="vp-btn vp-btn--primary" disabled={form.isSubmitting || !form.realName.trim() || !form.idCard.trim()}>
          {form.isSubmitting ? '初始化中…' : '开始人脸核身'}
        </button>
      </form>
    </div>
  )
}

function PhaseOneVerify({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <div className="vp-phase">
      <header className="vp-phase__header">
        <div className="vp-phase__icon vp-phase__icon--blue"><UserCheck size={22} strokeWidth={2} /></div>
        <div><h2>正在进行人脸核身</h2><p className="vp-phase__desc">请使用手机扫描下方二维码完成人脸识别。</p></div>
      </header>
      {form.faceUrl ? (
        <div className="vp-qr-wrapper">
          <img src={form.faceUrl} alt="人脸核身二维码" className="vp-qr-image" />
        </div>
      ) : null}
      <p className="vp-phase__hint">扫码后按照提示完成人脸核身，完成后系统将自动获取结果。</p>
    </div>
  )
}

function PhaseOneDone({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <div className="vp-phase">
      <header className="vp-phase__header vp-phase__header--success">
        <div className="vp-phase__icon vp-phase__icon--green"><CheckCircle2 size={22} strokeWidth={2} /></div>
        <div>
          <h2>{form.isFullyVerified ? '全部认证已完成' : '实名认证通过'}</h2>
          <p className="vp-phase__desc">{form.isFullyVerified ? '您的身份与机构认证均已通过。' : '已通过人脸核身身份验证。'}</p>
        </div>
      </header>
      {!form.isFullyVerified ? (
        <>
          <div className="vp-success-info">
            <div className="vp-success-info__row"><span className="vp-success-info__label">姓名</span><span className="vp-success-info__value">{form.realName}</span></div>
            <div className="vp-success-info__row"><span className="vp-success-info__label">身份证号</span><span className="vp-success-info__value">{form.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}</span></div>
          </div>
          <div className="vp-actions">
            <button type="button" className="vp-btn vp-btn--outline" onClick={form.handleBackToHome}><ArrowLeft size={16} /> 返回主页</button>
            <button type="button" className="vp-btn vp-btn--primary" onClick={form.goToOrgPhase}>继续进行机构认证 <ArrowRight size={16} /></button>
          </div>
        </>
      ) : (
        <div className="vp-actions">
          <button type="button" className="vp-btn vp-btn--primary" onClick={form.handleBackToHome}><ArrowLeft size={16} /> 返回主页</button>
        </div>
      )}
    </div>
  )
}

function PhaseTwoOrg({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <div className="vp-phase">
      <header className="vp-phase__header">
        <div className="vp-phase__icon vp-phase__icon--blue"><Building2 size={22} strokeWidth={2} /></div>
        <div><h2>机构身份激活</h2><p className="vp-phase__desc">选择身份通道完成机构认证。</p></div>
      </header>
      <div className="vp-channel-tabs" role="tablist" aria-label="认证通道">
        <button type="button" role="tab" className={`vp-channel-tab ${form.orgChannel === 'staff' ? 'vp-channel-tab--active' : ''}`}
          onClick={() => { form.setOrgChannel('staff'); form.clearError() }}><Briefcase size={16} /> 教职工/项目方通道</button>
        <button type="button" role="tab" className={`vp-channel-tab ${form.orgChannel === 'student' ? 'vp-channel-tab--active' : ''}`}
          onClick={() => { form.setOrgChannel('student'); form.clearError() }}><GraduationCap size={16} /> 学生快捷通道</button>
      </div>
      {form.errorMessage ? <div className="vp-error" role="alert">{form.errorMessage}</div> : null}
      {form.orgChannel === 'staff' ? <StaffForm form={form} /> : <StudentForm form={form} />}
    </div>
  )
}

function StaffForm({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <form className="vp-form" onSubmit={(e) => { e.preventDefault(); void form.submitStaffApply() }}>
      <div className="vp-field">
        <label htmlFor="vp-entity-code" className="vp-label">机构编码</label>
        <div className="vp-search-row">
          <input id="vp-entity-code" type="text" className="vp-input" value={form.entityCode}
            onChange={(e) => { form.setEntityCode(e.target.value); form.clearError() }}
            placeholder="社会统一信用代码 / 学校编码" disabled={form.isSubmitting} />
          <button type="button" className="vp-btn vp-btn--search" onClick={() => void form.searchEntity()}
            disabled={form.isSearchingEntity || !form.entityCode.trim()}>
            <Search size={16} /> {form.isSearchingEntity ? '检索中…' : '检索'}
          </button>
        </div>
        {form.entitySearchResults.length > 0 ? (
          <div className="vp-search-results">
            {form.entitySearchResults.map((entity: EntitySearchItem) => (
              <button key={entity.entityCode} type="button" className="vp-search-result-item"
                onClick={() => { form.setEntityCode(entity.entityCode); form.clearError() }}>
                <Building2 size={14} />
                <span className="vp-search-result-item__name">{entity.name}</span>
                <span className="vp-search-result-item__code">{entity.entityCode}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="vp-field">
        <label htmlFor="vp-realname-readonly" className="vp-label">真实姓名</label>
        <div className="vp-input-wrapper vp-input-wrapper--readonly">
          <IdCard size={14} className="vp-input-wrapper__icon" />
          <input id="vp-realname-readonly" type="text" className="vp-input vp-input--readonly" value={form.realName} readOnly disabled tabIndex={-1} />
        </div>
      </div>
      <div className="vp-field">
        <label htmlFor="vp-staff-number" className="vp-label">工号/员工编号</label>
        <input id="vp-staff-number" type="text" className="vp-input" value={form.staffNumber}
          onChange={(e) => { form.setStaffNumber(e.target.value); form.clearError() }}
          placeholder="请填写您的工号或员工编号" disabled={form.isSubmitting} />
      </div>
      <button type="submit" className="vp-btn vp-btn--primary" disabled={form.isSubmitting || !form.entityCode.trim() || !form.staffNumber.trim()}>
        {form.isSubmitting ? '提交中…' : '提交审核'}
      </button>
    </form>
  )
}

function StudentForm({ form }: { form: ReturnType<typeof useVerificationPage> }) {
  return (
    <form className="vp-form" onSubmit={(e) => { e.preventDefault(); void form.submitStudentActivate() }}>
      <div className="vp-field">
        <label htmlFor="vp-verify-code" className="vp-label">学生认证码</label>
        <input id="vp-verify-code" type="text" className="vp-input vp-input--code" value={form.verificationCode}
          onChange={(e) => { form.setVerificationCode(e.target.value); form.clearError() }}
          placeholder="例如：10598-2026-00123-0456" maxLength={24} disabled={form.isSubmitting} autoComplete="off" />
        <p className="vp-field__hint">格式：学校编码-年份-母码序号-子码序号（由辅导员生成）</p>
      </div>
      <div className="vp-field">
        <label htmlFor="vp-student-number" className="vp-label">学号</label>
        <input id="vp-student-number" type="text" className="vp-input" value={form.studentNumber}
          onChange={(e) => { form.setStudentNumber(e.target.value); form.clearError() }}
          placeholder="请输入学号" disabled={form.isSubmitting} autoComplete="off" />
      </div>
      <div className="vp-field">
        <label htmlFor="vp-realname-readonly" className="vp-label">真实姓名</label>
        <div className="vp-input-wrapper vp-input-wrapper--readonly">
          <IdCard size={14} className="vp-input-wrapper__icon" />
          <input id="vp-realname-readonly" type="text" className="vp-input vp-input--readonly" value={form.realName} readOnly disabled tabIndex={-1} />
        </div>
      </div>
      <div className="vp-field">
        <label htmlFor="vp-graduation-year" className="vp-label">毕业年份</label>
        <input id="vp-graduation-year" type="number" className="vp-input" value={form.graduationYear}
          onChange={(e) => { form.setGraduationYear(e.target.value); form.clearError() }}
          placeholder="例如：2030" min={1950} max={2100} maxLength={4} disabled={form.isSubmitting} autoComplete="off" />
      </div>
      <button type="submit" className="vp-btn vp-btn--primary" disabled={form.isSubmitting || !form.verificationCode.trim() || !form.studentNumber.trim() || !form.graduationYear}>
        {form.isSubmitting ? '激活中…' : '立即激活'}
      </button>
    </form>
  )
}

export default VerificationPage
