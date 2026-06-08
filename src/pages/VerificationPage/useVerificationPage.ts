import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { VerificationApiError, initFaceVerification, searchEntities, applyStaffVerification, activateStudentVerification } from '../../api/verification'
import { getUserPublicPreview } from '../../api/users'
import type { EntitySearchItem } from '../../api/verification/types'

// 01）认证阶段（VerificationPhase）
export type VerificationPhase = 'idle' | 'face-init' | 'face-verify' | 'face-done' | 'org-select'

// 02）机构认证通道（OrgVerificationChannel）
export type OrgVerificationChannel = 'staff' | 'student'

// 03）认证页面 Hook 返回值（UseVerificationPageResult）
export interface UseVerificationPageResult {
  phase: VerificationPhase
  errorMessage: string | null
  isSubmitting: boolean

  // 阶段一：人脸核身
  realName: string
  idCard: string
  faceToken: string | null
  faceUrl: string | null
  setRealName: (value: string) => void
  setIdCard: (value: string) => void
  startFaceVerification: () => Promise<void>

  // 阶段二：机构认证
  orgChannel: OrgVerificationChannel
  entityCode: string
  staffNumber: string
  verificationCode: string
  /** 学号（Student 通道使用） */
  studentNumber: string
  /** 毕业年份（4位，Student 通道使用） */
  graduationYear: string
  entitySearchResults: EntitySearchItem[]
  isSearchingEntity: boolean
  setOrgChannel: (value: OrgVerificationChannel) => void
  setEntityCode: (value: string) => void
  setStaffNumber: (value: string) => void
  setVerificationCode: (value: string) => void
  setStudentNumber: (value: string) => void
  setGraduationYear: (value: string) => void
  searchEntity: () => Promise<void>
  submitStaffApply: () => Promise<void>
  submitStudentActivate: () => Promise<void>

  goToOrgPhase: () => void
  handleBackToHome: () => void
  clearError: () => void
  /** 当前是否已全部认证通过，若为 true 则不展示「机构认证」按钮 */
  isFullyVerified: boolean
}

// 04）认证页面 Hook（useVerificationPage）
export function useVerificationPage(): UseVerificationPageResult {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  // 根据当前认证状态决定起始阶段
  const initialPhase: VerificationPhase = useMemo(() => {
    const status = userProfile?.verifyStatus
    if (status === 'identity_only') return 'org-select'
    if (status === 'verified') return 'face-done'
    return 'idle'
  }, [userProfile?.verifyStatus])

  const [phase, setPhase] = useState<VerificationPhase>(initialPhase)

  // 运行时同步：当 menu 数据异步加载后 verifyStatus 变化，页面自动跳阶段
  useEffect(() => {
    setPhase((prev) => {
      // 仅在当前处于初始未认证阶段时才向上跳转
      if (prev === 'idle' || prev === 'face-init') {
        if (userProfile?.verifyStatus === 'identity_only') return 'org-select'
        if (userProfile?.verifyStatus === 'verified') return 'face-done'
      }
      return prev
    })
  }, [userProfile?.verifyStatus])

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 阶段一
  const [realName, setRealName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [faceToken, setFaceToken] = useState<string | null>(null)
  const [faceUrl, setFaceUrl] = useState<string | null>(null)

  // 阶段二
  const [orgChannel, setOrgChannel] = useState<OrgVerificationChannel>('staff')
  const [entityCode, setEntityCode] = useState('')
  const [staffNumber, setStaffNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [entitySearchResults, setEntitySearchResults] = useState<EntitySearchItem[]>([])
  const [isSearchingEntity, setIsSearchingEntity] = useState(false)

  // 进入主体认证阶段时若缺少实名，从后端回填（token 自带 uid 校验身份）
  useEffect(() => {
    if (phase === 'org-select' || (phase === 'face-done' && !realName.trim())) {
      const uid = userProfile?.uid
      if (!uid) return
      void getUserPublicPreview(uid).then((preview) => {
        if (!realName.trim()) setRealName(preview.realName ?? preview.nickname)
      }).catch(() => { /* 静默失败 */ })
    }
  }, [phase, userProfile?.uid, realName])

  const clearError = useCallback((): void => setErrorMessage(null), [])

  const handleBackToHome = useCallback((): void => {
    navigate('/profile', { replace: true })
  }, [navigate])

  const goToOrgPhase = useCallback((): void => {
    setPhase('org-select')
    setErrorMessage(null)
  }, [])

  // 启动人脸核身
  const startFaceVerification = useCallback(async (): Promise<void> => {
    const trimmedName = realName.trim()
    const trimmedId = idCard.trim()
    if (!trimmedName) { setErrorMessage('请输入姓名'); return }
    if (!trimmedId || trimmedId.length < 15) { setErrorMessage('请输入有效的身份证号'); return }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await initFaceVerification({ realName: trimmedName, idCard: trimmedId })
      setPhase('face-verify')
      setFaceToken(result.token)
      setFaceUrl(result.qrCodeDataUrl)
    } catch (error) {
      setErrorMessage(error instanceof VerificationApiError ? error.message : '人脸核身初始化失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [realName, idCard])

  // 检索机构
  const searchEntity = useCallback(async (): Promise<void> => {
    const keyword = entityCode.trim()
    if (!keyword) { setErrorMessage('请输入机构编码或名称'); return }
    setErrorMessage(null)
    setIsSearchingEntity(true)
    try {
      const result = await searchEntities(keyword)
      setEntitySearchResults(result.entities)
      if (result.entities.length === 0) {
        setErrorMessage('未找到匹配的机构')
      }
    } catch (error) {
      setErrorMessage(error instanceof VerificationApiError ? error.message : '机构检索失败')
    } finally {
      setIsSearchingEntity(false)
    }
  }, [entityCode])

  // 教职工申请
  const submitStaffApply = useCallback(async (): Promise<void> => {
    const trimmedEntityCode = entityCode.trim()
    const trimmedName = realName.trim()
    const trimmedStaffNumber = staffNumber.trim()
    if (!trimmedEntityCode) { setErrorMessage('请选择或输入机构编码'); return }
    if (!trimmedStaffNumber) { setErrorMessage('请输入工号/员工编号'); return }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await applyStaffVerification({ entityCode: trimmedEntityCode, realName: trimmedName, staffNumber: trimmedStaffNumber })
      alert('申请已提交，等待机构管理员审核')
      navigate('/profile', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof VerificationApiError ? error.message : '提交申请失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [entityCode, realName, staffNumber, navigate])

  // 学生激活
  const submitStudentActivate = useCallback(async (): Promise<void> => {
    const code = verificationCode.trim()
    const sNumber = studentNumber.trim()
    const gYear = Number(graduationYear)
    const rName = realName.trim()
    if (!code) { setErrorMessage('请输入认证码'); return }
    if (!/^\d{5}-\d{4}-\d{5}-\d{4}$/.test(code)) { setErrorMessage('认证码格式不正确，应为：学校编码-年份-母码序号-子码序号'); return }
    if (!sNumber) { setErrorMessage('请输入学号'); return }
    if (!rName) { setErrorMessage('缺少实名信息，请先完成阶段一人脸核身'); return }
    if (!Number.isInteger(gYear) || gYear < 1950 || gYear > 2100) { setErrorMessage('请输入有效的毕业年份（1950-2100）'); return }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await activateStudentVerification({
        verificationCode: code,
        studentNumber: sNumber,
        realName: rName,
        graduationYear: gYear,
      })
      alert('激活成功')
      navigate('/profile', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof VerificationApiError ? error.message : '激活失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [verificationCode, studentNumber, graduationYear, realName, navigate])

  return {
    phase, errorMessage, isSubmitting,
    realName, idCard, faceToken, faceUrl,
    setRealName, setIdCard, startFaceVerification,
    orgChannel, entityCode, staffNumber, verificationCode, studentNumber, graduationYear,
    entitySearchResults, isSearchingEntity,
    setOrgChannel, setEntityCode, setStaffNumber, setVerificationCode, setStudentNumber, setGraduationYear,
    searchEntity, submitStaffApply, submitStudentActivate,
    goToOrgPhase, handleBackToHome, clearError,
    isFullyVerified: userProfile?.verifyStatus === 'verified',
  }
}
