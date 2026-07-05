// 01）TopNavbar 认证码桩弹窗（TopNavbarCodeModals）
// 02）组件 Props（TopNavbarCodeModalsProps）
export interface TopNavbarCodeModalsProps {
  isCodeGenerateModalOpen: boolean
  isCodeManageModalOpen: boolean
  onCloseGenerate: () => void
  onCloseManage: () => void
}

/**
 * 函数名：TopNavbarCodeModals
 * 功能：渲染学校认证码生成/管理占位弹窗。
 * 输入：
 * - isCodeGenerateModalOpen / isCodeManageModalOpen：弹窗开关
 * - onCloseGenerate / onCloseManage：关闭回调
 * 输出：
 * - 返回值：React 节点
 */
export function TopNavbarCodeModals({
  isCodeGenerateModalOpen,
  isCodeManageModalOpen,
  onCloseGenerate,
  onCloseManage,
}: TopNavbarCodeModalsProps) {
  return (
    <>
      {isCodeGenerateModalOpen ? (
        <div className="auth-modal-mask" role="presentation" onClick={onCloseGenerate}>
          <div
            className="auth-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '420px',
              height: 'auto',
              minHeight: '240px',
              gridTemplateColumns: '1fr',
              padding: '24px',
              margin: 'auto',
            }}
          >
            <h3>生成认证码</h3>
            <p style={{ color: 'var(--text-soft)', margin: '12px 0' }}>此功能重构中…</p>
            <button className="login-entry-button" type="button" onClick={onCloseGenerate}>
              关闭
            </button>
          </div>
        </div>
      ) : null}

      {isCodeManageModalOpen ? (
        <div className="auth-modal-mask" role="presentation" onClick={onCloseManage}>
          <div
            className="auth-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '560px',
              height: 'auto',
              minHeight: '320px',
              gridTemplateColumns: '1fr',
              padding: '24px',
              margin: 'auto',
            }}
          >
            <h3>认证码管理</h3>
            <p style={{ color: 'var(--text-soft)', margin: '12px 0' }}>此功能重构中…</p>
            <button className="login-entry-button" type="button" onClick={onCloseManage}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
