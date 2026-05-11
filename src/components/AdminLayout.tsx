import React, { useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardCheck, Building2, UserCircle2,
    FlaskConical, Briefcase, Rocket, Users2,
    GraduationCap, ShieldCheck, LogOut,
    Settings, Bell, MessageSquare
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const adminName = localStorage.getItem('admin_user') || 'Admin';

    const sidebarScrollKey = 'web-admin:sidebar-nav-menu:scrollTop';
    const navMenuRef = useRef<HTMLElement | null>(null);

    const restoreNavScroll = () => {
        const el = navMenuRef.current;
        if (!el) return;

        const raw = sessionStorage.getItem(sidebarScrollKey);
        if (!raw) return;

        const next = Number.parseInt(raw, 10);
        if (Number.isNaN(next)) return;

        el.scrollTop = next;
    };

    useEffect(() => {
        restoreNavScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // 路由变化时也尝试恢复一次，避免布局重新挂载或重渲染导致位置丢失
        requestAnimationFrame(() => restoreNavScroll());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const menuItems = useMemo(() => ([
        {
            title: 'DASHBOARD',
            items: [
                { name: '概览统计', path: '/dashboard', icon: <LayoutDashboard size={20} /> }
            ]
        },
        {
            title: 'TODO LIST',
            items: [
                { name: '待办事项', path: '/todo', icon: <ClipboardCheck size={20} /> }
            ]
        },
        {
            title: 'CORE ENTITIES',
            items: [
                { name: '机构/主体管理', path: '/entities', icon: <Building2 size={20} /> },
                { name: '用户/档案管理', path: '/users', icon: <UserCircle2 size={20} /> },
            ]
        },
        {
            title: 'TEAM HUB',
            items: [
                { name: '实验室管理', path: '/laboratories', icon: <FlaskConical size={20} /> },
                { name: '团队管理', path: '/teams', icon: <Users2 size={20} /> }
            ]
        },
        {
            title: 'PROJECT HUB',
            items: [
                { name: '商业项目管理', path: '/projects/commercial', icon: <Briefcase size={20} /> },
                { name: '实践/招募项目', path: '/projects/recruitment', icon: <Rocket size={20} /> },
            ]
        },
        {
            title: 'EXECUTION',
            items: [
                { name: '成就归档库', path: '/execution/achievements', icon: <GraduationCap size={20} /> }
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { name: '管理员中心', path: '/system/admins', icon: <ShieldCheck size={20} /> }
            ]
        }
    ]), []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <span className="logo-text">后台数据管理</span>
                </div>

                <nav
                    className="nav-menu"
                    ref={(el) => {
                        navMenuRef.current = el;
                    }}
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        sessionStorage.setItem(sidebarScrollKey, String(el.scrollTop));
                    }}
                >
                    {menuItems.map((section, idx) => (
                        <div key={idx} className="nav-section">
                            <p className="section-title">{section.title}</p>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="logout-area" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>退出登录</span>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-area">
                {/* Top Header */}
                <header className="top-header">
                    <div className="header-left">
                        <Settings className="header-icon" />
                    </div>
                    <div className="header-right">
                        <MessageSquare className="header-icon" />
                        <Bell className="header-icon" />
                        <div className="user-profile">
                            <span>Hi, <strong>{adminName}</strong></span>
                            <div className="avatar"></div>
                        </div>
                    </div>
                </header>

                {/* Content Page */}
                <div className="page-content">
                    {children}
                </div>
            </main>

            <style>{`
                .admin-container { display: flex; height: 100vh; background: #fafbfb; }
                .sidebar { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
                .logo { padding: 24px; display: flex; align-items: center; gap: 12px; font-weight: bold; font-size: 20px; }
                
                .nav-menu { flex: 1; padding: 0 16px; overflow-y: auto; }
                .section-title { color: #9ca3af; font-size: 12px; margin: 20px 0 10px 10px; font-weight: 600; }
                
                /* 核心改动：NavLink 渲染为 a 标签，需清除默认样式并使用 flex 布局 */
                .nav-item { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    padding: 12px; 
                    border-radius: 8px; 
                    color: #4b5563; 
                    cursor: pointer; 
                    transition: 0.3s; 
                    text-decoration: none; 
                }
                .nav-item:hover { background: #f3f4f6; }
                
                /* 高亮状态样式 */
                .nav-item.active {
                    background-color: #03c9d7;
                    color: white;
                }
                .nav-item.active svg {
                    color: white;
                }
                
                .logout-area { padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; cursor: pointer; color: #ef4444; }
                
                .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .top-header { height: 72px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
                .header-icon { color: #03c9d7; cursor: pointer; width: 20px; }
                .header-right { display: flex; align-items: center; gap: 20px; }
                .user-profile { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6b7280; }
                .avatar { width: 32px; height: 32px; background: #ddd; border-radius: 50%; }
                
                .page-content { flex: 1; padding: 24px; overflow-y: auto; }
            `}</style>
        </div>
    );
};

export default AdminLayout;