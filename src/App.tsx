import HomePage from './pages/HomePage/index.tsx'
import EnterprisePracticePage from './pages/EnterprisePracticePage/index.tsx'
import CampusRecruitPage from './pages/CampusRecruitPage/index.tsx'
import ProfileSpacePage from './pages/ProfileSpace/index.tsx'
import ExperienceSharePage from './pages/ExperienceSharePage/index.tsx'
import ProjectDetailPage from './pages/ProjectDetailPage/ProjectDetailPage.tsx'
import NoteDetailPage from './pages/NoteDetailPage/NoteDetailPage.tsx'
import InstantMessagePage from './pages/InstantMessagePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import OrganizationVerificationPage from './pages/VerificationPage/OrganizationVerificationPage.tsx'
import LabManagePage from './pages/LabManagePage.tsx'
import PublishProjectPage from './pages/PublishProject/index.tsx'
import PublishNotePage from './pages/PublishNote/index.tsx'
import ProtectedRoute from './components/routes/ProtectedRoute.tsx'
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfileSpacePage />} />
      <Route
        path="/verify/organization"
        element={
          <ProtectedRoute>
            <OrganizationVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab/manage"
        element={
          <ProtectedRoute>
            <LabManagePage />
          </ProtectedRoute>
        }
      />
      <Route path="/project-detail" element={<ProjectDetailPage />} />
      <Route path="/note-detail" element={<NoteDetailPage />} />
      <Route path="/messages" element={<InstantMessagePage />} />
      <Route
        path="/publish/project"
        element={
          <ProtectedRoute>
            <PublishProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/publish/note"
        element={
          <ProtectedRoute>
            <PublishNotePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
