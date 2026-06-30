// 01）应用路由表（appRouter）
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'

const HomePage = lazy(() => import('../pages/home/index'))
const CommercialProjectsPage = lazy(() => import('@pages/project/commercial/index'))
const CampusCoCreationPage = lazy(() => import('@pages/project/co-create/index'))
const PersonalProfilePage = lazy(() => import('@pages/profile-space/personal/index'))
const TeamProfilePage = lazy(() => import('@pages/profile-space/team/index'))
const OrganizationProfilePage = lazy(() => import('@pages/profile-space/organization/index'))
const NoteSharePage = lazy(() => import('@pages/note/share/index'))
const ProjectDetailPage = lazy(() => import('@pages/project/detail/index'))
const NoteReaderPage = lazy(() => import('@pages/note/reader/index'))
const InstantMessagePage = lazy(() => import('@pages/im/index'))
const LoginPage = lazy(() => import('@pages/auth/login/index'))
const OrganizationVerificationPage = lazy(() => import('@pages/auth/verify/index'))
const PublishProjectPage = lazy(() => import('@pages/project/publish/index'))
const PublishNotePage = lazy(() => import('@pages/note/publish/index'))
const NotFoundPage = lazy(() => import('@pages/not-found/index'))

// 02）加载中占位（PageLoadingFallback）
function PageLoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-soft)', fontSize: '14px' }}>加载中…</span>
    </div>
  )
}

// 03）Suspense 包装组件（Suspensed）
function Suspensed({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
}

// 04）路由表定义（appRouter）
const appRouter = createBrowserRouter([
  { path: '/', element: <Suspensed><HomePage /></Suspensed> },
  { path: '/project', element: <Suspensed><CommercialProjectsPage /></Suspensed> },
  { path: '/co-create', element: <Suspensed><CampusCoCreationPage /></Suspensed> },
  { path: '/note', element: <Suspensed><NoteSharePage /></Suspensed> },
  { path: '/login', element: <Suspensed><LoginPage /></Suspensed> },
  { path: '/profile', element: <Suspensed><PersonalProfilePage /></Suspensed> },
  { path: '/profile/:profileTab', element: <Suspensed><PersonalProfilePage /></Suspensed> },
  { path: '/team', element: <Suspensed><TeamProfilePage /></Suspensed> },
  { path: '/team/:teamTab', element: <Suspensed><TeamProfilePage /></Suspensed> },
  { path: '/team/:teamTab/:teamSubTab', element: <Suspensed><TeamProfilePage /></Suspensed> },
  { path: '/org', element: <Suspensed><OrganizationProfilePage /></Suspensed> },
  { path: '/org/:orgTab', element: <Suspensed><OrganizationProfilePage /></Suspensed> },
  { path: '/verify/organization', element: <Suspensed><ProtectedRoute><OrganizationVerificationPage /></ProtectedRoute></Suspensed> },
  { path: '/verify', element: <Suspensed><ProtectedRoute><OrganizationVerificationPage /></ProtectedRoute></Suspensed> },
  { path: '/project/detail', element: <Suspensed><ProtectedRoute><ProjectDetailPage /></ProtectedRoute></Suspensed> },
  { path: '/note/detail', element: <Suspensed><NoteReaderPage /></Suspensed> },
  { path: '/messages', element: <Suspensed><ProtectedRoute><InstantMessagePage /></ProtectedRoute></Suspensed> },
  { path: '/project/publish', element: <Suspensed><ProtectedRoute><PublishProjectPage /></ProtectedRoute></Suspensed> },
  { path: '/note/publish', element: <Suspensed><ProtectedRoute><PublishNotePage /></ProtectedRoute></Suspensed> },
  { path: '*', element: <Suspensed><NotFoundPage /></Suspensed> },
])

// 05）应用入口组件（App）
function App() {
  return <RouterProvider router={appRouter} />
}

export default App
