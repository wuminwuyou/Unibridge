import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VerificationStep, type VerificationGuideTab } from '../../components/AuthModal'
import TopNavbar from '../../layout/TopNavbar'
import '../../styles/OrganizationVerificationPage.css'

// 01）邮箱后缀校验（isEduCnMailbox）
/**
 * 函数名：isEduCnMailbox
 * 功能：校验输入邮箱是否为 .edu.cn 后缀。
 * 实现方法：
 * - 裁剪空白并转小写
 * - 使用 endsWith 做后缀匹配
 * 输入：
 * - email：邮箱字符串
 * 输出：
 * - 返回值：是否匹配 .edu.cn
 * - 副作用：无
 */
function isEduCnMailbox(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail.endsWith('.edu.cn')
}

// 03）主体认证页面（OrganizationVerificationPage）
/**
 * 函数名：OrganizationVerificationPage
 * 功能：提供独立的主体认证页面，承载教育邮箱与证件上传引导流程。
 * 实现方法：
 * - 复用 TopNavbar 作为页面导航
 * - 复用 AuthModal 的 VerificationStep 作为认证表单主体
 * - 返回按钮跳转回个人空间 /profile
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function OrganizationVerificationPage() {
  const navigate = useNavigate()
  const [verificationTab, setVerificationTab] = useState<VerificationGuideTab>('edu-mail')
  const [eduMailbox, setEduMailbox] = useState<string>('')
  const eduMailboxMatched = useMemo<boolean>(() => isEduCnMailbox(eduMailbox), [eduMailbox])

  return (
    <div className="organization-verification-page">
      <TopNavbar />
      <main className="organization-verification-page__main" aria-label="主体认证">
        <div className="organization-verification-page__card">
          <VerificationStep
            verificationTab={verificationTab}
            eduMailbox={eduMailbox}
            eduMailboxMatched={eduMailboxMatched}
            onVerificationTabChange={setVerificationTab}
            onEduMailboxChange={setEduMailbox}
            onBackToAuthForm={() => navigate('/profile')}
          />
        </div>
      </main>
    </div>
  )
}

export default OrganizationVerificationPage
