import HomePage from './pages/HomePage.tsx'
import EnterprisePracticePage from './pages/EnterprisePracticePage.tsx'
import CampusRecruitPage from './pages/CampusRecruitPage.tsx'
import ProfileSpacePage from './pages/ProfileSpacePage.tsx'
import ExperienceSharePage from './pages/ExperienceSharePage.tsx'
import ProjectDetailPage from './pages/ProjectDetailPage.tsx'
import NoteDetailPage from './pages/NoteDetailPage.tsx'
import InstantMessagePage from './pages/InstantMessagePage.tsx'
import { Navigate, Route, Routes } from 'react-router-dom'

// 01）应用入口组件（App）
/**
 * 函数名：App
 * 功能：作为 Web Client 应用根组件，集中管理页面级路由映射。
 * 实现方法：
 * - 引入首页与个人空间页面组件
 * - 使用 Routes / Route 配置路径与页面组件的对应关系
 * - 增加通配符重定向，避免非法路径导致空白页
 * 输入：
 * - 无
 * 输出：
 * - 返回值：JSX.Element，应用路由容器
 * - 副作用：无
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/enterprise" element={<EnterprisePracticePage />} />
      <Route path="/campus-recruit" element={<CampusRecruitPage />} />
      <Route path="/experience-share" element={<ExperienceSharePage />} />
      <Route path="/profile" element={<ProfileSpacePage />} />
      <Route path="/project-detail" element={<ProjectDetailPage />} />
      <Route path="/note-detail" element={<NoteDetailPage />} />
      <Route path="/messages" element={<InstantMessagePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
