// 01）项目难度评估结果卡片（ProjectEvaluateCard）
// 展示后端返回的评估等级、评估说明与修改建议
import { LEVEL_DEFINITIONS, FALLBACK_LEVEL_DEFINITION } from '@shared/lib/levelConstants'
import type { EvaluateProjectResponse } from '../api/evaluateProjectApi'
import styles from './project-evaluate-card.module.css'

export interface ProjectEvaluateCardProps {
  result: EvaluateProjectResponse
}

// 02）解析等级展示（resolveLevelDisplay）
function resolveLevelDisplay(level: string): { label: string; color: string; background: string } {
  const code = level.trim().toUpperCase()
  const def = LEVEL_DEFINITIONS[code as keyof typeof LEVEL_DEFINITIONS]
  if (def) return { label: `${code} (${def.label})`, color: def.color, background: def.background }
  return { label: `${code} (${FALLBACK_LEVEL_DEFINITION.label})`, color: FALLBACK_LEVEL_DEFINITION.color, background: FALLBACK_LEVEL_DEFINITION.background }
}

// 03）项目难度评估结果卡片（ProjectEvaluateCard）
export function ProjectEvaluateCard({ result }: ProjectEvaluateCardProps) {
  const levelDisplay = resolveLevelDisplay(result.level)
  const hasSuggestions = result.suggestions && result.suggestions.trim().length > 0

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>项目难度评估结果</span>
        <span className={styles.disclaimer}>仅供参考</span>
        {!hasSuggestions && (
          <span className={styles.passTag}>评估通过</span>
        )}
      </div>

      {/* 评估等级 */}
      <div className={styles.levelRow}>
        <span className={styles.levelLabel}>评估等级：</span>
        <span
          className={styles.levelBadge}
          style={{ color: levelDisplay.color, background: levelDisplay.background }}
        >
          {levelDisplay.label}
        </span>
      </div>

      {/* 评估说明（为什么是这个等级） */}
      <div className={styles.explanation}>
        <p className={styles.sectionLabel}>评估说明</p>
        <p className={styles.bodyText}>{result.explanation}</p>
      </div>

      {/* 修改建议（仅内容不够详尽时展示） */}
      {hasSuggestions && (
        <div className={styles.suggestions}>
          <p className={styles.sectionLabel}>修改建议</p>
          <p className={styles.bodyText}>{result.suggestions}</p>
        </div>
      )}
    </div>
  )
}
