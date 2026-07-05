// 01）TopNavbar Widget 组装（TopNavbarWidget）
import './style.css'
import AuthModal from '@widgets/auth-modal'
import { NoteEditorTypeModal } from '@features/note-editor-entry'
import {
  TopNavbarBrandGroup,
  TopNavbarCodeModals,
  TopNavbarHeaderActions,
  TopNavbarNavMenu,
} from './components'
import { useTopNavbarWidget } from './hooks/useTopNavbarWidget'
import { mainNavItemLabels } from './navRoutes'

/**
 * 函数名：TopNavbarWidget
 * 功能：顶部导航 Widget 入口——组合品牌、主导航、操作区与弹窗。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function TopNavbarWidget() {
  const model = useTopNavbarWidget()

  return (
    <header className={model.headerClassName}>
      <div className="top-header__inner">
        <TopNavbarBrandGroup />
        <TopNavbarNavMenu navItems={mainNavItemLabels} activeNavItem={model.activeNavItem} />
        <TopNavbarHeaderActions model={model} />
      </div>

      <AuthModal
        open={model.isAuthModalOpen}
        onClose={() => model.setIsAuthModalOpen(false)}
        onSuccess={() => model.setIsAuthModalOpen(false)}
      />

      <TopNavbarCodeModals
        isCodeGenerateModalOpen={model.isCodeGenerateModalOpen}
        isCodeManageModalOpen={model.isCodeManageModalOpen}
        onCloseGenerate={() => model.setIsCodeGenerateModalOpen(false)}
        onCloseManage={() => model.setIsCodeManageModalOpen(false)}
      />

      <NoteEditorTypeModal
        open={model.noteEditorTypeModal.isOpen}
        onClose={model.noteEditorTypeModal.close}
        onSelect={model.noteEditorTypeModal.selectType}
      />
    </header>
  )
}

export default TopNavbarWidget
export { TopNavbarWidget }
