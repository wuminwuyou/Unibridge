// 01）高校招募子类型卡片（CampusRecruitOptionCard）
// 纯展示——selected 由 props 控制，onClick 注入
import styles from './CampusRecruitOptionCard.module.css'

export interface CampusRecruitOptionCardProps {
  label: string
  description: string
  selected: boolean
  onClick: () => void
}

export function CampusRecruitOptionCard({ label, description, selected, onClick }: CampusRecruitOptionCardProps) {
  return (
    <label
      className={`${styles.card} ${selected ? styles.active : ''}`.trim()}
      onClick={onClick}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.description}>{description}</span>
    </label>
  )
}
