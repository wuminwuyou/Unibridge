import React from 'react';
import AdminLayout from '../components/AdminLayout';

const Dashboard: React.FC = () => {
    return (
        <AdminLayout>
            <div className="dashboard-grid">
                {/* Banner Card */}
                <div className="card banner-card">
                    <div className="banner-text">
                        <h3>Earnings</h3>
                        <p className="price">$93,438.78</p>
                        <button className="download-btn">Download</button>
                    </div>
                </div>

                {/* Small Stat Cards */}
                {[
                    { label: 'Customers', val: '39,354', color: '#e2f5f5' },
                    { label: 'Products', val: '4,396', color: '#fef3c7' },
                    { label: 'Sales', val: '423.39', color: '#fee2e2' },
                    { label: 'Refunds', val: '39,354', color: '#f0fdf4' },
                ].map((item, i) => (
                    <div key={i} className="card stat-card">
                        <div className="stat-icon" style={{ background: item.color }}></div>
                        <p className="stat-val">{item.val}</p>
                        <p className="stat-label">{item.label}</p>
                    </div>
                ))}

                {/* Revenue Chart Section */}
                <div className="card revenue-card">
                    <div className="rev-header">
                        <h4>Revenue Update</h4>
                    </div>
                    <div className="rev-content">
                        {/* 这里以后可以接入 Echarts 或 Recharts */}
                        <div className="placeholder-chart">
                            [ 柱状图占位符 ]
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;