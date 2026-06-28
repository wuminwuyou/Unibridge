// 01）认证弹窗布局壳（AuthModalLayout）—— Portal + 双栏 + 品牌区
import { createPortal } from 'react-dom'
import type { MouseEvent } from 'react'
import CloseIconButton from '../../../shared/ui/CloseIconButton'
import PersonalForm from '../../../features/auth-process/components/AuthModal/PersonalForm'
import InstitutionForm from '../../../features/auth-process/components/AuthModal/InstitutionForm'
import TwoFactorAuthForm from '../../../features/auth-process/components/AuthModal/TwoFactorAuthForm'
import VerificationStep from '../../../features/auth-process/components/AuthModal/VerificationStep'
import type { AuthModalModel } from '../index'

interface AuthModalLayoutProps {
  onClose: () => void
  model: AuthModalModel
}

export function AuthModalLayout({ onClose, model }: AuthModalLayoutProps) {
  const handleMaskClick = () => { onClose() }
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => { e.stopPropagation() }

  return createPortal(
    <div className="auth-modal-mask" onClick={handleMaskClick} role="presentation">
      <div className="auth-modal auth-modal--full" role="dialog" aria-modal="true" aria-label="登录注册" onClick={handleContainerClick}>
        <CloseIconButton className="auth-modal-close auth-modal-close-floating" onClick={onClose} ariaLabel="关闭登录弹窗" />
        <aside className="auth-modal-visual">
          <div className="auth-brand-logo-motion" aria-hidden="true">U</div>
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
                <div className="auth-tabs" role="tablist">
                  <button role="tab" className={`auth-tab ${model.activeTab === 'personal' ? 'active' : ''}`} onClick={() => model.setActiveTab('personal')}>个人通道</button>
                  <button role="tab" className={`auth-tab ${model.activeTab === 'organization' ? 'active' : ''}`} onClick={() => model.setActiveTab('organization')}>主体通道</button>
                </div>
              </header>
              <div className="auth-channel-slide">
                <div className={`auth-channel-slide__track ${model.activeTab === 'organization' ? 'auth-channel-slide__track--organization' : ''}`}>
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
                    ) : model.organizationStep === 'otp' ? (
                      <TwoFactorAuthForm
                        organizationOtpCode={model.organizationOtpCode}
                        isSubmitting={model.isSubmitting}
                        authErrorMessage={model.authErrorMessage}
                        onOtpChange={model.setOrganizationOtpCode}
                        onSubmit={model.handleOrganizationOtpSubmit}
                        onBackToCredentials={model.handleBackFromOrganizationOtp}
                      />
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
            <VerificationStep
              verificationTab={model.verificationTab}
              eduMailbox={model.eduMailbox}
              eduMailboxMatched={model.eduMailboxMatched ?? false}
              onVerificationTabChange={model.setVerificationTab}
              onEduMailboxChange={model.setEduMailbox}
              onBackToAuthForm={model.handleBackToAuthForm}
            />
          </div>
        </section>
      </div>
    </div>,
    document.body,
  )
}
