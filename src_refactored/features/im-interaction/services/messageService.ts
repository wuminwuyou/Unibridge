// 01）即时通讯 Feature — Services（消息发送、状态管理）
// 当前为桩实现，后续对接 WebSocket / HTTP 消息接口
export async function sendMessage(conversationId: string, content: string): Promise<void> {
  // TODO: 对接消息发送接口
  console.log('[IM] Sending message to', conversationId, content)
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  // TODO: 对接已读状态接口
  console.log('[IM] Marking message as read', messageId)
}
