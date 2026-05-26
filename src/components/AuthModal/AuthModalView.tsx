import { createPortal } from 'react-dom'
import type { MouseEvent } from 'react'
import CloseIconButton from '../common/CloseIconButton'
import InstitutionForm from './components/InstitutionForm'
import EntityTotpBindModal from './components/EntityTotpBindModal'
import EntityTotpSetupNoticeForm from './components/EntityTotpSetupNoticeForm'
import OrganizationAdminRegisterForm from './components/OrganizationAdminRegisterForm'
import OrganizationAdminSelectForm from './components/OrganizationAdminSelectForm'
import PersonalForm from './components/PersonalForm'
import TwoFactorAuthForm from './components/TwoFactorAuthForm'
import VerificationStep from './components/VerificationStep'
import type { AuthModalModel } from './useAuthModal'

// 01）认证弹窗纯布局参数（AuthModalViewProps）
interface AuthModalViewProps {
  onClose: () => void
  model: AuthModalModel
}

// 02）认证弹窗纯布局组件（AuthModalView）
/**
 * 函数名：AuthModalView
 * 功能：仅负责弹窗 DOM 结构、遮罩与右侧面板拼装，不包含业务状态定义。
 * 实现方法：
 * - createPortal 挂到 document.body
 * - 个人 / 主体通道以双栏轨道横向滑动切换（个人在左、主体在右）
 * - 根据 model.organizationStep 在主体栏内切换凭证表单与 2FA
 * - 认证引导区由 VerificationStep 独立承担
 * 输入：
 * - onClose：关闭回调
 * - model：useAuthModal 返回的状态与处理器集合
 * 输出：
 * - 返回值：Portal 渲染的 JSX
 * - 副作用：无（事件由 model 内处理器承担）
 */
export function AuthModalView({ onClose, model }: AuthModalViewProps) {
  // 03）遮罩点击关闭（handleMaskClick）
  const handleMaskClick = (): void => {
    onClose()
  }

  // 04）阻止弹窗内点击冒泡（handleContainerClick）
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  return (
    <>
      {createPortal(
    <div className="auth-modal-mask" onClick={handleMaskClick} role="presentation" aria-hidden={false}>
      <div
        className="auth-modal auth-modal--full"
        role="dialog"
        aria-modal="true"
        aria-label="登录注册弹窗"
        onClick={handleContainerClick}
      >
        <CloseIconButton className="auth-modal-close auth-modal-close-floating" onClick={onClose} ariaLabel="关闭登录弹窗" />

        <aside className="auth-modal-visual">
          <div className="auth-brand-logo-motion" aria-hidden="true">
            U
          </div>
          <div className="auth-modal-visual__glass">
            <div className="auth-modal-visual__logo">U</div>
            <h2>UniBridge</h2>
            <p>让学习中的每一步，都清晰可见</p>
            <p>让每一份实践经历，都成为可信的成长资产。</p>
          </div>
        </aside>

        <section className={`auth-modal-panel ${model.showVerificationGuide ? 'auth-modal-panel--verification' : ''}`}>
          <div className="auth-modal-panel__slider">
            <div className="auth-modal-auth-view">
              <header className="auth-modal-auth-view__header">
                <div className="auth-tabs" role="tablist" aria-label="登录通道切换">
                  <button
                    type="button"
                    role="tab"
                    className={`auth-tab ${model.activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => model.setActiveTab('personal')}
                  >
                    个人通道
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`auth-tab ${model.activeTab === 'organization' ? 'active' : ''}`}
                    onClick={() => model.setActiveTab('organization')}
                  >
                    主体通道
                  </button>
                </div>
              </header>

              {/* 05）通道内容双栏轨道（auth-channel-slide）：个人在左、主体在右，切换时横向平移 */}
              <div className="auth-channel-slide" aria-hidden={false}>
                <div
                  className={`auth-channel-slide__track ${model.activeTab === 'organization' ? 'auth-channel-slide__track--organization' : ''}`}
                >
                  <div className="auth-channel-slide__pane">
                    <PersonalForm
                      personalPanelView={model.personalPanelView}
                      shouldRenderPersonalLoginForm={model.shouldRenderPersonalLoginForm}
                      shouldRenderPersonalRegisterForm={model.shouldRenderPersonalRegisterForm}
                      personalLoginMode={model.personalLoginMode}
                      personalPhone={model.personalPhone}
                      personalCode={model.personalCode}
                      rememberMe={model.rememberMe}
                      isSubmitting={model.isSubmitting}
                      authErrorMessage={model.authErrorMessage}
                      isPersonalPasswordVisible={model.isPersonalPasswordVisible}
                      registerAccount={model.registerAccount}
                      registerPassword={model.registerPassword}
                      registerConfirmPassword={model.registerConfirmPassword}
                      registerCode={model.registerCode}
                      registerHintMessage={model.registerHintMessage}
                      isSendingPersonalLoginCode={model.isSendingPersonalLoginCode}
                      isSendingRegisterCode={model.isSendingRegisterCode}
                      personalLoginCodeCooldownSec={model.personalLoginCodeCooldownSec}
                      registerCodeCooldownSec={model.registerCodeCooldownSec}
                      onSetPersonalPhone={model.setPersonalPhone}
                      onSetPersonalCode={model.setPersonalCode}
                      onSetRememberMe={model.setRememberMe}
                      onSetRegisterAccount={model.setRegisterAccount}
                      onSetRegisterPassword={model.setRegisterPassword}
                      onSetRegisterConfirmPassword={model.setRegisterConfirmPassword}
                      onSetRegisterCode={model.setRegisterCode}
                      onSubmitPersonalLogin={model.handlePersonalSubmit}
                      onSubmitPersonalRegister={model.handlePersonalRegisterSubmit}
                      onSwitchToSmsLogin={model.handleSwitchToSmsLoginMode}
                      onSwitchToPasswordLogin={model.handleSwitchToPasswordLoginMode}
                      onSwitchToRegister={model.handleSwitchToRegisterForm}
                      onSwitchToLogin={model.handleSwitchToLoginForm}
                      onTogglePasswordVisibility={model.handleTogglePersonalPasswordVisibility}
                      onSendPersonalLoginCode={model.handleSendPersonalLoginCode}
                      onSendRegisterCode={model.handleSendRegisterCode}
                    />
                  </div>
                  <div className="auth-channel-slide__pane">
                    {model.organizationStep === 'credentials' ? (
                      <InstitutionForm
                        organizationCode={model.organizationCode}
                        organizationPassword={model.organizationPassword}
                        isOrganizationPasswordVisible={model.isOrganizationPasswordVisible}
                        isSubmitting={model.isSubmitting}
                        authErrorMessage={model.authErrorMessage}
                        onOrganizationCodeChange={model.setOrganizationCode}
                        onOrganizationPasswordChange={model.setOrganizationPassword}
                        onToggleOrganizationPasswordVisibility={model.handleToggleOrganizationPasswordVisibility}
                        onSubmit={model.handleOrganizationCredentialsSubmit}
                      />
                    ) : model.organizationStep === 'admin-select' ? (
                      <OrganizationAdminSelectForm
                        entityName={model.organizationEntityName}
                        admins={model.organizationAdminOptions}
                        selectedAdminUid={model.organizationSelectedAdminUid}
                        isSubmitting={model.isSubmitting}
                        authErrorMessage={model.authErrorMessage}
                        onSelectedAdminChange={model.setOrganizationSelectedAdminUid}
                        onSubmit={model.handleOrganizationAdminSelectSubmit}
                        onBackToCredentials={model.handleBackToOrganizationCredentials}
                      />
                    ) : model.organizationStep === 'admin-register' ? (
                      <OrganizationAdminRegisterForm
                        entityName={model.organizationEntityName}
                        currentAdminOrder={model.organizationCurrentAdminOrder}
                        boundAdminCount={model.organizationBoundAdminCount}
                        minAdminCount={model.organizationMinAdminCount}
                        maxAdminCount={model.organizationMaxAdminCount}
                        displayName={model.organizationAdminDisplayName}
                        adminPassword={model.organizationAdminPassword}
                        isAdminPasswordVisible={model.isOrganizationAdminPasswordVisible}
                        isSubmitting={model.isSubmitting}
                        authErrorMessage={model.authErrorMessage}
                        successMessage={model.totpSetupSuccessMessage}
                        onDisplayNameChange={model.setOrganizationAdminDisplayName}
                        onAdminPasswordChange={model.setOrganizationAdminPassword}
                        onToggleAdminPasswordVisibility={model.handleToggleOrganizationAdminPasswordVisibility}
                        onSubmit={model.handleOrganizationAdminRegisterSubmit}
                        onBack={model.handleBackFromOrganizationAdminRegister}
                      />
                    ) : model.organizationStep === 'totp-setup' ? (
                      <EntityTotpSetupNoticeForm
                        entityName={model.organizationEntityName}
                        currentAdminOrder={model.organizationCurrentAdminOrder}
                        boundAdminCount={model.organizationBoundAdminCount}
                        minAdminCount={model.organizationMinAdminCount}
                        maxAdminCount={model.organizationMaxAdminCount}
                        onConfirm={model.handleOpenEntityTotpBindModal}
                        onBackToCredentials={model.handleBackToOrganizationCredentials}
                      />
                    ) : (
                      <TwoFactorAuthForm
                        organizationOtpCode={model.organizationOtpCode}
                        isSubmitting={model.isSubmitting}
                        authErrorMessage={model.authErrorMessage}
                        onOtpChange={model.setOrganizationOtpCode}
                        onSubmit={model.handleOrganizationOtpSubmit}
                        onBackToCredentials={model.handleBackFromOrganizationOtp}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <VerificationStep
              verificationTab={model.verificationTab}
              eduMailbox={model.eduMailbox}
              eduMailboxMatched={model.eduMailboxMatched}
              onVerificationTabChange={model.setVerificationTab}
              onEduMailboxChange={model.setEduMailbox}
              onBackToAuthForm={model.handleBackToAuthForm}
            />
          </div>
        </section>
      </div>
    </div>,
    document.body,
      )}

      <EntityTotpBindModal
        open={model.isEntityTotpBindModalOpen}
        entityName={model.organizationEntityName}
        qrCodeDataUrl={model.totpSetupQrCodeDataUrl}
        qrCodeCountdownSec={model.totpSetupQrCountdownSec}
        qrCodeExpireTotalSec={model.totpSetupQrExpireTotalSec}
        isQrExpired={model.isTotpSetupQrExpired}
        isQrLoading={model.isTotpSetupQrLoading}
        totpSetupOtpCode={model.totpSetupOtpCode}
        isSubmitting={model.isSubmitting}
        authErrorMessage={model.authErrorMessage}
        successMessage={model.totpSetupSuccessMessage}
        onTotpSetupOtpChange={model.setTotpSetupOtpCode}
        onRefreshQrCode={model.loadEntityTotpSetupQr}
        onSubmit={model.handleOrganizationTotpSetupConfirm}
        onClose={model.handleCloseEntityTotpBindModal}
      />
    </>
  )
}
