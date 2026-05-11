import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';

import { hashPassword } from '../utils/crypto';
import { loginAPI } from '../api/loginAPI';

const Login: React.FC = () => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isDevMode, setIsDevMode] = useState(false); // 调试模式状态
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        // --- 调试模式逻辑 ---
        if (isDevMode) {
            console.warn('⚠️ 当前处于调试模式：跳过 API 校验');
            localStorage.setItem('admin_token', 'dev_mode_mock_token');
            localStorage.setItem('admin_refresh_token', 'dev_mode_mock_refresh_token');
            localStorage.setItem('admin_user', adminId || 'debug_admin');
            setTimeout(() => {
                setIsLoading(false);
                navigate('/dashboard');
            }, 500); // 模拟一点点延迟，更有真实感
            return;
        }

        // 这里的逻辑后续对接后端 API: /api/v1/admin/login
        try {
            // 1. 发起真实请求
            // alert(hashPassword(password));
            const hashedPassword = hashPassword(password);
            // 注意：这里传入的对象属性名要和后端接口（LoginRequest）定义的保持一致
            const res = await loginAPI({
                adminId: adminId,
                passwordHash: hashedPassword
            });

            // 2. 根据拦截器处理后的结果进行逻辑判断
            // 如果拦截器已经判断 res.code === 200 才放行，这里直接拿 res.data
            if (res.code !== 200) {
                throw new Error(res.message);
            }
            const { token, admin_id, refreshToken, refresh_token } = res.data;

            // 3. 身份持久化
            localStorage.setItem('admin_token', token);
            const refreshTokenValue = refreshToken || refresh_token;
            if (refreshTokenValue) {
                localStorage.setItem('admin_refresh_token', refreshTokenValue);
            }
            localStorage.setItem('admin_user', admin_id);

            // 4. 跳转
            navigate('/dashboard');

        } catch (error: any) {
            // 这里的 error 是 request.ts 拦截器中 Promise.reject 抛出的那个 Error 对象
            setErrorMsg(error.message || '登录失败，请检查账号密码');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>UniBridge Admin</h2>
                <p>系统管理后台</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>管理员账号</label>
                        <input
                            type="text"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            placeholder="请输入ID"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-group">
                        <label>安全密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? '验证中...' : '进入系统'}
                    </button>
                </form>

                {/* 调试模式切换器 */}
                <div className="dev-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={isDevMode}
                            onChange={(e) => setIsDevMode(e.target.checked)}
                        />
                        调试模式
                    </label>
                </div>
            </div>
            {errorMsg && (
                <Message
                    type="error"
                    content={errorMsg}
                    onClose={() => setErrorMsg(null)}
                />
            )}
        </div>
    );
};

export default Login;