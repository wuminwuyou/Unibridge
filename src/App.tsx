import HomePage from './pages/HomePage/index.tsx'
import CommercialProjectsPage from './pages/CommercialProjects/index.tsx'
import CampusCoCreationPage from './pages/CampusCoCreation/index.tsx'
import ProfileSpacePage from './pages/ProfileSpace/index.tsx'
import { TeamViewPage } from './pages/ProfileSpace/variants/TeamView'
import { OrganizationViewPage } from './pages/ProfileSpace/variants/OrganizationView'
import NoteSharePage from './pages/NoteShare/index.tsx'
import ProjectDetailPage from './pages/ProjectDetailPage/ProjectDetailPage.tsx'
import NoteReaderPage from './pages/NoteReader'
import InstantMessagePage from './pages/InstantMessagePage/InstantMessagePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import OrganizationVerificationPage from './pages/VerificationPage/OrganizationVerificationPage.tsx'
import PublishProjectPage from './pages/PublishProject/index.tsx'
import PublishNotePage from './pages/PublishNote/index.tsx'
import OnlineTextEditorPage from './pages/OnlineTextEditor/index.tsx'
import ProtectedRoute from './components/routes/ProtectedRoute.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

// 01）应用路由表（appRouter）
const appRouter = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/project', element: <CommercialProjectsPage /> },
  { path: '/co-create', element: <CampusCoCreationPage /> },
  { path: '/note', element: <NoteSharePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/profile', element: <ProfileSpacePage /> },
  { path: '/profile/:profileTab', element: <ProfileSpacePage /> },
  { path: '/team/:teamUid', element: <TeamViewPage /> },
  { path: '/team/:teamUid/:teamTab', element: <TeamViewPage /> },
  { path: '/team/:teamUid/:teamTab/:teamSubTab', element: <TeamViewPage /> },
  { path: '/org/:entityCode', element: <OrganizationViewPage /> },
  { path: '/org/:entityCode/:orgTab', element: <OrganizationViewPage /> },
  {
    path: '/verify/organization',
    element: (
      <ProtectedRoute>
        <OrganizationVerificationPage />
      </ProtectedRoute>
    ),
  },
  { path: '/project-detail', element: <ProjectDetailPage /> },
  { path: '/note-detail', element: <NoteReaderPage /> },
  { path: '/messages', element: <InstantMessagePage /> },
  {
    path: '/publish/project',
    element: (
      <ProtectedRoute>
        <PublishProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/publish/note',
    element: (
      <ProtectedRoute>
        <PublishNotePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/publish/markdown-editor',
    element: (
      <ProtectedRoute>
        <OnlineTextEditorPage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

// 02）应用入口组件（App）
/**
 * 函数名：App
 * 功能：作为 Web Client 应用根组件，通过 data router 提供路由（支持 useBlocker 等能力）。
 * 输出：
 * - 返回值：RouterProvider
 */
function App() {
  return <RouterProvider router={appRouter} />
}

export default App
