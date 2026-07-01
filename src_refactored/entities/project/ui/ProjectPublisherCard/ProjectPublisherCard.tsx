// 01）发布者信息卡片纯展示组件（ProjectPublisherCard）
// 职责：展示项目发布者的头像、名称、职业/学籍背景、所属企业、地理位置
// 禁止：navigate / API / feature import
import type { ProjectOwnerInfo } from '../../model/projectDetailViewModel'
import styles from './ProjectPublisherCard.module.css'

// 02）发布者卡片 Props（ProjectPublisherCardProps）
export interface ProjectPublisherCardProps {
  owner: ProjectOwnerInfo
}

// 03）发布者信息卡片（ProjectPublisherCard）
/**
 * 函数名：ProjectPublisherCard
 * 功能：纯展示项目发布者的身份信息。
 * 输入：
 * - owner：ProjectOwnerInfo（发布者 uid / name / avatarUrl / careerData / organization / location）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProjectPublisherCard({ owner }: ProjectPublisherCardProps) {
  const nameInitial = owner.name.charAt(0).toUpperCase()

  const detailParts: string[] = []
  if (Array.isArray(owner.careerData) && owner.careerData.length > 0) {
    detailParts.push(owner.careerData.filter((v): v is string => typeof v === 'string').join(' · '))
  }
  if (owner.organization) {
    detailParts.push(owner.organization)
  }
  if (owner.location) {
    detailParts.push(owner.location)
  }

  return (
    <section className={styles.card}>
      {owner.avatarUrl ? (
        <img
          src={owner.avatarUrl}
          alt={owner.name}
          className={styles.avatar}
        />
      ) : (
        <span className={styles.avatarFallback} aria-hidden="true">
          {nameInitial}
        </span>
      )}
      <div className={styles.info}>
        <h2 className={styles.name}>{owner.name}</h2>
        {detailParts.length > 0 && (
          <p className={styles.detail}>{detailParts.join(' · ')}</p>
        )}
      </div>
    </section>
  )
}
