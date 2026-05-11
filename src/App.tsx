import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TODO from './pages/TODO'
import Entities from './pages/Entities'
import Users from './pages/users';
import Laboratories from './pages/laboratories';
import CommercialProjects from './pages/CommercialProjects'
import RecruitmentProjects from './pages/RecruitmentProjects';
import Teams from './pages/Teams'
import Achievements from './pages/Achievements';
import Admins from './pages/Admins';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/todo" element={<TODO />} />
      <Route path="/entities" element={<Entities />} />
      <Route path="/users" element={<Users />} />
      <Route path="/laboratories" element={<Laboratories />} />
      <Route path="/projects/commercial" element={<CommercialProjects />} />
      <Route path="/projects/recruitment" element={<RecruitmentProjects />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/execution/achievements" element={<Achievements />} />
      <Route path="/system/admins" element={<Admins />} />
      {/* 默认访问根目录重定向到登录 */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* 404 处理 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;