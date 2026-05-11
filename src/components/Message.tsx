import React, { useEffect, useState } from 'react';

interface MessageProps {
    type: 'error' | 'success' | 'warning' | 'info';
    content: string;
    onClose: () => void;
    duration?: number; // 多少毫秒后自动消失
    fadeDuration?: number; // 渐变消失耗时（毫秒）
    topOffset?: number; // 多条消息时的垂直偏移量
}

// 01）通用消息提示组件（Message）
/**
 * 函数名：Message
 * 功能：渲染自动消失的顶部消息提示，并支持关闭前渐变动画。
 * 实现方法：
 * - 先等待 duration 后进入 closing 状态
 * - closing 状态持续 fadeDuration 后触发 onClose
 * - 通过 topOffset 支持多条消息纵向堆叠展示
 * 输入：
 * - type：消息类型（error/success/warning/info）
 * - content：消息内容
 * - onClose：关闭回调
 * - duration：多久后开始关闭，默认 3000ms
 * - fadeDuration：渐变关闭时长，默认 300ms
 * - topOffset：消息距顶部偏移量，默认 20px
 * 输出：
 * - 返回值：ReactElement
 * - 副作用：创建并清理定时器
 */
const Message: React.FC<MessageProps> = ({
    type,
    content,
    onClose,
    duration = 3000,
    fadeDuration = 300,
    topOffset = 20,
}) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setIsClosing(false);
        const startCloseTimer = setTimeout(() => {
            setIsClosing(true);
        }, Math.max(duration, 0));

        return () => clearTimeout(startCloseTimer);
    }, [duration, content, type]);

    useEffect(() => {
        if (!isClosing) {
            return;
        }
        const closeTimer = setTimeout(() => {
            onClose();
        }, Math.max(fadeDuration, 0));
        return () => clearTimeout(closeTimer);
    }, [isClosing, fadeDuration, onClose]);

    const getStyle = () => {
        switch (type) {
            case 'error': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
            case 'success': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
            case 'warning': return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
            case 'info': return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' };
            default: return { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
        }
    };

    const colors = getStyle();

    return (
        <div style={{
            position: 'fixed',
            top: `${topOffset}px`,
            left: '50%',
            transform: `translateX(-50%) translateY(${isClosing ? '-6px' : '0'})`,
            padding: '12px 24px',
            borderRadius: '6px',
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            opacity: isClosing ? 0 : 1,
            transition: `opacity ${fadeDuration}ms ease, transform ${fadeDuration}ms ease`
        }}>
            {type === 'error' && <span>⚠️</span>}
            {type === 'success' && <span>✅</span>}
            {type === 'info' && <span>ℹ️</span>}
            {content}
        </div>
    );
};

export default Message;