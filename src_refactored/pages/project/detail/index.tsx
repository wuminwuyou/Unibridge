// 01）项目详情页路由入口（ProjectDetailPage）
// 职责：组装 TopNavbar + EditorBanner + 状态卡片 + 居中双栏内容
// 数据编排由 Widget Hook 负责，page 仅透传 vm 给 UI

import { useProjectDetailWidget } from '@widgets/project-detail/hooks/useProjectDetailWidget'
import ProjectDetailContent from '@widgets/project-detail'
import TopNavbar from '@widgets/top-navbar'
import { EditorialPreviewBanner } from '@features/project-detail-editorial'
import '@shared/styles/DetailPage.css'
import styles from './ProjectDetailPage.module.css'

// 02）ProjectDetailPage
function ProjectDetailPage() {
  const vm = useProjectDetailWidget()

  return (
    <div className={`${styles.page} ${vm.isEditorialFlow ? styles.pageEditorial : ''}`.trim()}>
      {!vm.isEditorialFlow ? <TopNavbar /> : null}
      {vm.isEditorialFlow && vm.project ? (
        <EditorialPreviewBanner status={vm.project.publishStatus} />
      ) : null}

      <div className={styles.shell}>
        {vm.showLoading ? (
          <section className="detail-card" aria-label="项目详情加载中">
            <p className="detail-card__label">项目详情</p>
            <h1>加载中…</h1>
            <p>正在从服务器获取项目内容。</p>
          </section>
        ) : vm.showError ? (
          <section className="detail-card" aria-label="项目详情错误">
            <p className="detail-card__label">项目详情</p>
            <h1>加载失败</h1>
            <p>{vm.errorMessage ?? '无法获取项目详情，请稍后重试。'}</p>
          </section>
        ) : vm.project ? (
          <ProjectDetailContent project={vm.project} />
        ) : (
          <section className="detail-card" aria-label="项目详情信息">
            <p className="detail-card__label">项目详情</p>
            <h1>未找到项目</h1>
            <p>请从发布项目页保存草稿、预览或发布后查看，或通过有效标题链接访问。</p>
          </section>
        )}
      </div>
    </div>
  )
}

export default ProjectDetailPage
