import { notifyNewMessage } from './notificationService';

export interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  receiver: string;
  content: string;
  timestamp: string;
}

const STORAGE_KEY = 'tutor_chat_messages';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getBeijingTime(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + 3600000 * 8);
  return beijing.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChatKey(userA: string, userB: string): string {
  return [userA, userB].sort().join('::');
}

function getAllMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllMessages(data: Record<string, ChatMessage[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMessages(userA: string, userB: string): ChatMessage[] {
  const all = getAllMessages();
  return all[getChatKey(userA, userB)] || [];
}

export function sendMessage(
  sender: string,
  senderAvatar: string,
  receiver: string,
  _receiverAvatar: string,
  content: string
): ChatMessage[] {
  const all = getAllMessages();
  const key = getChatKey(sender, receiver);
  if (!all[key]) all[key] = [];

  all[key].push({
    id: generateId(),
    sender,
    senderAvatar,
    receiver,
    content,
    timestamp: getBeijingTime(),
  });

  saveAllMessages(all);
  // 通知接收者
  notifyNewMessage(receiver, sender, senderAvatar, content);
  return all[key];
}
