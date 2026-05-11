// 01）通用可比对字段提取器类型（ConsistencySelector）
type ConsistencySelector<TItem> = (item: TItem) => unknown;

// 02）通用一致性校验参数类型（ConsistencyCheckParams）
interface ConsistencyCheckParams<TItem> {
    optimisticItem: TItem;
    serverItem: TItem;
    selectors: ConsistencySelector<TItem>[];
}

// 03）通用变更校准参数类型（ReconcileMutationParams）
interface ReconcileMutationParams<TItem, TId> {
    list: TItem[];
    targetId: TId;
    optimisticItem: TItem;
    responseData: unknown;
    mapServerItem: (responseData: unknown, fallback: TItem) => TItem;
    selectors: ConsistencySelector<TItem>[];
    getId: (item: TItem) => TId;
    shouldKeepItem: (item: TItem) => boolean;
}

// 04）通用变更校准结果类型（ReconcileMutationResult）
interface ReconcileMutationResult<TItem> {
    nextList: TItem[];
    serverItem: TItem;
    isConsistent: boolean;
}

// 05）通用一致性校验函数（checkMutationConsistency）
/**
 * 函数名：checkMutationConsistency
 * 功能：按字段提取器列表校验乐观数据与服务端数据是否一致。
 * 实现方法：
 * - 遍历 selectors 提取两侧字段值
 * - 使用 JSON.stringify 做结构级比较（兼容数组/对象）
 * - 任一字段不一致即返回 false
 * 输入：
 * - params：一致性校验参数（optimisticItem/serverItem/selectors）
 * 输出：
 * - 返回值：boolean，true 表示一致，false 表示存在差异
 * - 副作用：无
 */
export function checkMutationConsistency<TItem>(params: ConsistencyCheckParams<TItem>): boolean {
    const { optimisticItem, serverItem, selectors } = params;
    return selectors.every((selector) =>
        JSON.stringify(selector(optimisticItem)) === JSON.stringify(selector(serverItem)),
    );
}

// 06）通用乐观更新校准函数（reconcileOptimisticMutation）
/**
 * 函数名：reconcileOptimisticMutation
 * 功能：基于接口响应统一完成乐观更新校准、目标行替换与一致性判断。
 * 实现方法：
 * - 通过 mapServerItem 将 response.data 映射为服务端标准项
 * - 用 checkMutationConsistency 对乐观项与服务端项进行一致性校验
 * - 将列表中目标项替换为服务端项，并按 shouldKeepItem 过滤
 * 输入：
 * - params：通用校准参数（list/targetId/optimisticItem/responseData 等）
 * 输出：
 * - 返回值：ReconcileMutationResult<TItem>（nextList/serverItem/isConsistent）
 * - 副作用：无（纯函数）
 */
export function reconcileOptimisticMutation<TItem, TId>(
    params: ReconcileMutationParams<TItem, TId>,
): ReconcileMutationResult<TItem> {
    const {
        list,
        targetId,
        optimisticItem,
        responseData,
        mapServerItem,
        selectors,
        getId,
        shouldKeepItem,
    } = params;
    const serverItem = mapServerItem(responseData, optimisticItem);
    const isConsistent = checkMutationConsistency({
        optimisticItem,
        serverItem,
        selectors,
    });
    const nextList = list.flatMap((item) => {
        if (getId(item) !== targetId) {
            return [item];
        }
        return shouldKeepItem(serverItem) ? [serverItem] : [];
    });
    return {
        nextList,
        serverItem,
        isConsistent,
    };
}

export type { ConsistencySelector, ReconcileMutationResult };
