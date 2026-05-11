import React from 'react';
import { Search } from 'lucide-react';

// 01）通用列表表格容器组件参数类型（ListTableCardProps）
interface ListTableCardProps {
    headers: string[];
    tableClassName: string;
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    isLoading: boolean;
    errorMsg: string | null;
    isEmpty: boolean;
    emptyText: string;
    children: React.ReactNode;
}

// 02）通用列表表格容器组件（ListTableCard）
/**
 * 函数名：ListTableCard
 * 功能：渲染管理页通用的“搜索栏 + 表格 + 加载/错误/空态”卡片区域。
 * 实现方法：
 * - 统一渲染工具栏搜索输入，透传输入值与变更回调
 * - 根据 isLoading/errorMsg/isEmpty 切换表格空态行
 * - 当有数据时渲染调用方传入的 tbody 行节点
 * 输入：
 * - headers：表头文案数组
 * - tableClassName：表格 className
 * - searchPlaceholder：搜索输入占位文案
 * - searchValue：搜索输入值
 * - onSearchChange：搜索输入回调
 * - isLoading：加载状态
 * - errorMsg：错误信息
 * - isEmpty：是否为空列表
 * - emptyText：空列表文案
 * - children：数据行节点
 * 输出：
 * - 返回值：ReactElement
 * - 副作用：无
 */
const ListTableCard: React.FC<ListTableCardProps> = ({
    headers,
    tableClassName,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    isLoading,
    errorMsg,
    isEmpty,
    emptyText,
    children,
}) => (
    <div className="card table-container">
        <div className="table-toolbar">
            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>
        </div>

        <table className={tableClassName}>
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={header}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {isLoading ? (
                    <tr>
                        <td colSpan={headers.length} className="detail-member-empty">加载中...</td>
                    </tr>
                ) : errorMsg ? (
                    <tr>
                        <td colSpan={headers.length} className="detail-member-empty">{errorMsg}</td>
                    </tr>
                ) : isEmpty ? (
                    <tr>
                        <td colSpan={headers.length} className="detail-member-empty">{emptyText}</td>
                    </tr>
                ) : children}
            </tbody>
        </table>
    </div>
);

export default ListTableCard;
