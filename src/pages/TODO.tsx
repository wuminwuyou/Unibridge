import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Message from '../components/Message';
import { UserCheck, Clock, ShieldAlert } from 'lucide-react';

// 定义认证申请的类型
interface AuthRequest {
    id: number;
    userId: string | number;
    entityName: string;
    role: 'PM' | 'MENTOR' | 'FACULTY' | 'STUDENT';
    applyTime: string;
}

const TODO: React.FC = () => {
    const [msg, setMsg] = useState<{ type: 'success' | 'error', content: string } | null>(null);

    // 模拟从数据库 user_auth_link 表中获取的待审核数据
    const [authRequests, setAuthRequests] = useState<AuthRequest[]>([
        { id: 1, userId: '10001', entityName: '浙江大学', role: 'STUDENT', applyTime: '2026-04-17 10:00' },
        { id: 2, userId: '20005', entityName: '阿里巴巴', role: 'PM', applyTime: '2026-04-17 11:30' },
    ]);

    // 处理审核逻辑
    const handleAudit = (id: number, status: 'PASS' | 'REJECT') => {
        // 实际开发时这里调用 loginAPI 所在目录下新创建的 todoAPI
        console.log(`审核项目ID: ${id}, 结果: ${status}`);

        // 模拟成功后的 UI 反馈
        setAuthRequests(prev => prev.filter(item => item.id !== id));
        setMsg({
            type: status === 'PASS' ? 'success' : 'error',
            content: status === 'PASS' ? '身份认证已通过' : '申请已被驳回'
        });
    };

    return (
        <AdminLayout>
            <div className="todo-header">
                <h1>待办事项</h1>
                <p>处理系统关键审批与任务流</p>
            </div>

            <div className="todo-grid">
                {/* 身份认证审核模块 */}
                <section className="todo-section card">
                    <div className="section-header">
                        <div className="title-wrapper">
                            <UserCheck className="icon" />
                            <h3>身份认证审核 ({authRequests.length})</h3>
                        </div>
                        <span className="badge">重要</span>
                    </div>

                    <div className="request-list">
                        {authRequests.length > 0 ? (
                            authRequests.map(req => (
                                <div key={req.id} className="request-item">
                                    <div className="req-info">
                                        <p className="req-user">用户 ID: <strong>{req.userId}</strong></p>
                                        <p className="req-detail">
                                            申请加入 <span>{req.entityName}</span> 为 <strong>{req.role}</strong>
                                        </p>
                                        <div className="req-time">
                                            <Clock size={14} /> {req.applyTime}
                                        </div>
                                    </div>
                                    <div className="req-actions">
                                        <button className="btn-pass" onClick={() => handleAudit(req.id, 'PASS')}>通过</button>
                                        <button className="btn-reject" onClick={() => handleAudit(req.id, 'REJECT')}>拒绝</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">暂无待处理的认证申请</div>
                        )}
                    </div>
                </section>

                {/* 以后可以扩展其他待办模块，如“提现申请”、“违规举报”等 */}
                <section className="todo-section card disabled">
                    <div className="section-header">
                        <div className="title-wrapper">
                            <ShieldAlert className="icon" />
                            <h3>项目预算变更申请</h3>
                        </div>
                    </div>
                    <p className="placeholder-text">暂未开放</p>
                </section>
            </div>

            {msg && (
                <Message
                    type={msg.type}
                    content={msg.content}
                    onClose={() => setMsg(null)}
                />
            )}
        </AdminLayout>
    );
};

export default TODO;