// 01）项目详情 Widget 主组件（ProjectDetailWidget）
// 职责：组装 entities + features + TopNavbar，替换旧 ProjectDetailPage.tsx
// 禁止：直接 API 调用（经 entity Hook）；禁止手写 DTO 映射（经 entity lib）

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TopNavbar from '@widgets/top-navbar'
import {
  ProjectDetailHero,
  ProjectCooperationCard,
  ProjectDetailContentSection,
} from '@entities/project'
import { ContentReader } from '@shared/ui/Reader'
import { EditorialPreviewBanner } from '@features/project-detail-editorial'
import { useProjectDetailWidget } from './hooks/useProjectDetailWidget'
import '@shared/styles/DetailPage.css'
import styles from './ProjectDetailWidget.module.css'

// 02）ProjectDetailWidget
function ProjectDetailWidget() {
  const vm = useProjectDetailWidget()

  return (
    <div className={`${styles.page} ${vm.isEditorialFlow ? styles.pageEditorial : ''}`.trim()}>
      {!vm.isEditorialFlow ? <TopNavbar /> : null}
      {vm.isEditorialFlow && vm.project ? (
        <EditorialPreviewBanner status={vm.project.publishStatus} />
      ) : null}

      {vm.showLoading ? (
        <main className={styles.main} style={{ width: 'min(1400px, 70vw)', margin: '24px auto 0', paddingBottom: 36 }}>
          <section className="detail-card" aria-label="项目详情加载中">
            <p className="detail-card__label">项目详情</p>
            <h1>加载中…</h1>
            <p>正在从服务器获取项目内容。</p>
          </section>
        </main>
      ) : vm.showError ? (
        <main className={styles.main} style={{ width: 'min(1400px, 70vw)', margin: '24px auto 0', paddingBottom: 36 }}>
          <section className="detail-card" aria-label="项目详情错误">
            <p className="detail-card__label">项目详情</p>
            <h1>加载失败</h1>
            <p>{vm.errorMessage ?? '无法获取项目详情，请稍后重试。'}</p>
          </section>
        </main>
      ) : vm.project ? (
        <div className={styles.shell}>
          <ProjectDetailHero
            project={vm.project}
            showBackLink={!vm.isEditorialFlow}
            backLinkSlot={
              !vm.isEditorialFlow ? (
                <Link to="/projects/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'inherit', textDecoration: 'none' }}>
                  <ArrowLeft className="h-4 w-4" />
                  返回编辑
                </Link>
              ) : null
            }
          />
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <ProjectCooperationCard
                amount={vm.project.amount}
                duration={vm.project.duration}
                teamSize={vm.project.teamSize}
                deadline={vm.project.deadline}
              />
            </aside>

            <main className={styles.main}>
              <ProjectDetailContentSection editorType={vm.project.descriptionEditorType}>
                <ContentReader
                  contentLongtext={{
                    editorType: vm.project.descriptionEditorType,
                    longtext: vm.project.description,
                  }}
                  className={styles.content}
                />
              </ProjectDetailContentSection>
            </main>
          </div>
        </div>
      ) : (
        <main className={styles.main} style={{ width: 'min(1400px, 70vw)', margin: '24px auto 0', paddingBottom: 36 }}>
          <section className="detail-card" aria-label="项目详情信息">
            <p className="detail-card__label">项目详情</p>
            <h1>未找到项目</h1>
            <p>请从发布项目页保存草稿、预览或发布后查看，或通过有效标题链接访问。</p>
          </section>
        </main>
      )}
    </div>
  )
}

export default ProjectDetailWidget
