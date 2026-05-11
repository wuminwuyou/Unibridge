// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
        // replace 确保用户点击回退键不会回到被拦截的页面
        return <Navigate to="/login" replace />;
    }

    // React 19 允许直接返回 children 而不需要额外的 Fragment
    return <>{children}</>;
};