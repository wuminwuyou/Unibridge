import { Eye, Star, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NoteDetailAuthor } from '../model/noteDetailCommon'
import styles from './NoteAuthorCard.module.css'

// 01）笔记作者卡片 Props（NoteAuthorCardProps）
export interface NoteAuthorCardProps {
  author: NoteDetailAuthor
  views: number
  favorites: number
  comments: number
  profilePath?: string | null
  onFollow?: () => void
}

// 02）解析作者姓名首字（resolveInitial）
function resolveInitial(name: string): string {
  return name?.trim().slice(0, 1) || 'U'
}

// 03）笔记作者卡片组件（NoteAuthorCard）
/**
 * 函数名：NoteAuthorCard
 * 功能：纯展示组件，显示作者头像/昵称/机构、关注按钮及浏览/收藏/评论统计。
 * 实现方法：
 * - profilePath 存在时以 Link 包裹作者信息；否则展示为纯 div
 * - onFollow 存在时显示关注按钮
 * 输入：
 * - author：作者信息（name / organization / avatarUrl / uid）
 * - views：浏览数
 * - favorites：收藏数
 * - comments：评论数
 * - profilePath：作者个人空间路由路径，可选
 * - onFollow：关注回调，可选
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function NoteAuthorCard({
  author,
  views,
  favorites,
  comments,
  profilePath,
  onFollow,
}: NoteAuthorCardProps) {
  const initial = resolveInitial(author.name)
  const orgText = author.organization || ''

  const authorMain = (
    <>
      {author.avatarUrl ? (
        <img className={styles.noteAuthorAvatar} src={author.avatarUrl} alt={author.name} />
      ) : (
        <span className={styles.noteAuthorAvatarFallback}>{initial}</span>
      )}
      <div className={styles.noteAuthorText}>
        <p className={styles.noteAuthorName}>{author.name}</p>
        <p className={styles.noteAuthorOrg}>{orgText}</p>
      </div>
    </>
  )

  return (
    <div className={styles.noteAuthorCard + ' p-4'}>
      <div className={styles.noteAuthorBlock}>
        {profilePath ? (
          <Link to={profilePath} className={styles.noteAuthorLink}>
            {authorMain}
          </Link>
        ) : (
          <div className={styles.noteAuthorRow}>
            {authorMain}
          </div>
        )}
        {onFollow ? (
          <button type="button" className={styles.noteFollowBtn} onClick={onFollow} aria-label="关注作者">
            关注
          </button>
        ) : null}
      </div>
      <div className={styles.noteStatsRow}>
        <span className={styles.noteStatsItem}><Eye size={12} aria-hidden="true" />{views} 浏览</span>
        <span className={styles.noteStatsItem}><Star size={12} aria-hidden="true" />{favorites} 收藏</span>
        <span className={styles.noteStatsItem}><ThumbsUp size={12} aria-hidden="true" />{comments} 评论</span>
      </div>
    </div>
  )
}
