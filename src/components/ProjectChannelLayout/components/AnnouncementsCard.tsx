import type { Announcement } from '../../../types/project'
import SidebarCard from './SidebarCard'

// 01）公告卡片参数（AnnouncementsCardProps）
interface AnnouncementsCardProps {
  announcements: Announcement[]
}

// 02）平台公告卡片（AnnouncementsCard）
/**
 * 函数名：AnnouncementsCard
 * 功能：渲染项目频道页右栏的「平台公告」卡片。
 * 实现方法：
 * - 复用 SidebarCard 外壳，含「查看更多」入口
 * - 遍历公告渲染标题与日期
 * 输入：
 * - announcements：公告数据数组
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  return (
    <SidebarCard title="平台公告" actionText="查看更多">
      <ul className="notice-list">
        {announcements.map((notice) => (
          <li key={`${notice.title}-${notice.date}`}>
            <a href="#!">{notice.title}</a>
            <span>{notice.date}</span>
          </li>
        ))}
      </ul>
    </SidebarCard>
  )
}

export default AnnouncementsCard
