// 01）认证弹窗业务 Hook（useAuthModal）—— 组合 2 个子 Hook
import { useEffect, useMemo, useState } from 'react'
import { syncPersonalAccountCache } from '../utils/authHelpers'
import { usePersonalAuth } from './usePersonalAuth'
import { useOrgAuth } from './useOrgAuth'
import type { AuthTabType, VerificationGuideTab, AuthModalProps } from '../types/authModalTypes'

export function useAuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTabType>('personal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerificationGuide, setShowVerificationGuide] = useState(false)
  const [verificationTab, setVerificationTab] = useState<VerificationGuideTab>('edu-mail')
  const [authErrorMessage, setAuthErrorMessage] = useState('')
  const [eduMailbox, setEduMailbox] = useState('')
  const eduMailboxMatched = useMemo(() => eduMailbox.trim().toLowerCase().endsWith('.edu.cn'), [eduMailbox])

  const personal = usePersonalAuth(setAuthErrorMessage, setIsSubmitting, onSuccess, onClose)
  const org = useOrgAuth(setAuthErrorMessage, setIsSubmitting, onSuccess, onClose)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => { syncPersonalAccountCache(personal.personalPhone, personal.rememberMe) }, [personal.personalPhone, personal.rememberMe])

  return {
    activeTab, setActiveTab, isSubmitting, showVerificationGuide, verificationTab, setVerificationTab,
    authErrorMessage, setAuthErrorMessage, eduMailbox, setEduMailbox, eduMailboxMatched,

    personalPhone: personal.personalPhone, setPersonalPhone: personal.setPersonalPhone,
    personalCode: personal.personalCode, setPersonalCode: personal.setPersonalCode,
    rememberMe: personal.rememberMe, setRememberMe: personal.setRememberMe,
    personalLoginMode: personal.personalLoginMode, personalPanelView: personal.personalPanelView,
    isPersonalPasswordVisible: personal.isPersonalPasswordVisible,
    isSendingPersonalLoginCode: personal.isSendingPersonalLoginCode,
    personalLoginCodeCooldownSec: personal.personalLoginCodeCooldownSec,
    shouldRenderPersonalLoginForm: personal.showPersonalLogin,
    shouldRenderPersonalRegisterForm: personal.showPersonalRegister,

    registerAccount: personal.registerAccount, setRegisterAccount: personal.setRegisterAccount,
    registerPassword: personal.registerPassword, setRegisterPassword: personal.setRegisterPassword,
    registerConfirmPassword: personal.registerConfirmPassword, setRegisterConfirmPassword: personal.setRegisterConfirmPassword,
    registerCode: personal.registerCode, setRegisterCode: personal.setRegisterCode,
    registerHintMessage: personal.registerHintMessage,
    isSendingRegisterCode: personal.isSendingRegisterCode,
    registerCodeCooldownSec: personal.registerCodeCooldownSec,

    organizationStep: org.orgStep,
    organizationCode: org.orgCode, setOrganizationCode: org.setOrgCode,
    organizationPassword: org.orgPassword, setOrganizationPassword: org.setOrgPassword,
    isOrganizationPasswordVisible: org.isOrgPasswordVisible,
    organizationOtpCode: org.orgOtpCode, setOrganizationOtpCode: org.setOrgOtpCode,
    organizationEntityName: org.orgEntityName,
    organizationBoundAdminCount: org.orgBoundAdminCount,
    organizationMinAdminCount: org.orgMinAdminCount,
    organizationMaxAdminCount: org.orgMaxAdminCount,
    organizationCurrentAdminOrder: org.orgCurrentAdminOrder,
    organizationAdminOptions: org.orgAdminOptions,
    organizationSelectedAdminUid: org.orgSelectedAdminUid,
    setOrganizationSelectedAdminUid: org.setOrgSelectedAdminUid,
    organizationAdminDisplayName: org.orgAdminDisplayName,
    setOrganizationAdminDisplayName: org.setOrgAdminDisplayName,
    organizationAdminPassword: org.orgAdminPassword,
    setOrganizationAdminPassword: org.setOrgAdminPassword,
    isOrganizationAdminPasswordVisible: org.isOrgAdminPasswordVisible,

    totpSetupQrCodeDataUrl: org.totpQrDataUrl,
    totpSetupQrCountdownSec: org.totpQrCountdownSec,
    totpSetupQrExpireTotalSec: org.totpQrExpireTotalSec,
    isTotpSetupQrExpired: org.isTotpQrExpired,
    isTotpSetupQrLoading: org.isTotpQrLoading,
    totpSetupOtpCode: org.totpOtpCode, setTotpSetupOtpCode: org.setTotpOtpCode,
    totpSetupSuccessMessage: org.totpSuccessMessage,
    isEntityTotpBindModalOpen: org.isTotpBindModalOpen,

    handleSendPersonalLoginCode: personal.handleSendPersonalLoginCode,
    handleSendRegisterCode: personal.handleSendRegisterCode,
    handlePersonalSubmit: personal.handlePersonalSubmit,
    handlePersonalRegisterSubmit: personal.handlePersonalRegisterSubmit,
    handleOrganizationCredentialsSubmit: org.handleOrgCredentialsSubmit,
    handleOrganizationOtpSubmit: org.handleOrgOtpSubmit,
    handleOrganizationAdminSelectSubmit: org.handleOrgAdminSelectSubmit,
    handleOrganizationAdminRegisterSubmit: org.handleOrgAdminRegisterSubmit,
    handleOrganizationTotpSetupConfirm: org.handleTotpSetupConfirm,
    handleBackToOrganizationCredentials: org.resetOrgState,
    handleBackFromOrganizationOtp: org.resetOrgState,
    handleBackFromOrganizationAdminRegister: org.handleBackFromOrgAdminRegister,
    handleOpenEntityTotpBindModal: org.handleOpenTotpBindModal,
    handleCloseEntityTotpBindModal: org.handleCloseTotpBindModal,
    loadEntityTotpSetupQr: org.loadTotpSetupQr,
    handleSwitchToSmsLoginMode: personal.switchToSms,
    handleSwitchToPasswordLoginMode: personal.switchToPassword,
    handleSwitchToRegisterForm: personal.switchToRegister,
    handleSwitchToLoginForm: personal.switchToLogin,
    handleTogglePersonalPasswordVisibility: personal.togglePersonalPasswordVisibility,
    handleToggleOrganizationPasswordVisibility: org.toggleOrgPasswordVisibility,
    handleToggleOrganizationAdminPasswordVisibility: org.toggleOrgAdminPasswordVisibility,
    handleBackToAuthForm: () => setShowVerificationGuide(false),
  }
}

export type AuthModalModel = ReturnType<typeof useAuthModal>
