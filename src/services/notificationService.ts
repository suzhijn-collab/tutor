export interface AppNotification {
  id: string;
  type: 'post_like' | 'comment_like' | 'new_comment' | 'friend_request' | 'friend_accept' | 'new_message';
  message: string;
  fromUser: string;
  fromAvatar: string;
  targetId: string; // postId / commentId / requestId
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'tutor_notifications';

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

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): void {
  const notifications = getNotifications();
  notifications.unshift({
    ...notif,
    id: generateId(),
    timestamp: getBeijingTime(),
    read: false,
  });
  // 最多保留 50 条
  if (notifications.length > 50) {
    notifications.length = 50;
  }
  saveNotifications(notifications);
}

export function markAllRead(): void {
  const notifications = getNotifications();
  notifications.forEach((n) => (n.read = true));
  saveNotifications(notifications);
}

export function markRead(notificationId: string): void {
  const notifications = getNotifications();
  const n = notifications.find((n) => n.id === notificationId);
  if (n) n.read = true;
  saveNotifications(notifications);
}

export function clearNotifications(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 在讨论区操作中触发通知：
 * - 别人点赞你的帖子 → post_like
 * - 别人评论你的帖子 → new_comment
 * - 别人点赞你的评论 → comment_like
 */
export function notifyPostLike(
  postAuthor: string,
  liker: string,
  likerAvatar: string,
  postId: string,
  postTitle: string,
): void {
  if (liker === postAuthor) return;
  addNotification({
    type: 'post_like',
    message: `${liker} 赞了你的帖子「${postTitle}」`,
    fromUser: liker,
    fromAvatar: likerAvatar,
    targetId: postId,
  });
}

export function notifyNewComment(
  postAuthor: string,
  commenter: string,
  commenterAvatar: string,
  postId: string,
  postTitle: string,
): void {
  if (commenter === postAuthor) return;
  addNotification({
    type: 'new_comment',
    message: `${commenter} 评论了你的帖子「${postTitle}」`,
    fromUser: commenter,
    fromAvatar: commenterAvatar,
    targetId: postId,
  });
}

export function notifyCommentLike(
  commentAuthor: string,
  liker: string,
  likerAvatar: string,
  commentId: string,
): void {
  if (liker === commentAuthor) return;
  addNotification({
    type: 'comment_like',
    message: `${liker} 赞了你的评论`,
    fromUser: liker,
    fromAvatar: likerAvatar,
    targetId: commentId,
  });
}

/** 好友发来新消息 */
export function notifyNewMessage(
  receiver: string,
  sender: string,
  senderAvatar: string,
  content: string,
): void {
  if (sender === receiver) return;
  const preview = content.length > 20 ? content.slice(0, 20) + '…' : content;
  addNotification({
    type: 'new_message',
    message: `${sender}：${preview}`,
    fromUser: sender,
    fromAvatar: senderAvatar,
    targetId: '',
  });
}

/** 获取好友相关通知 */
export function getFriendNotifications(): AppNotification[] {
  return getNotifications().filter((n) =>
    n.type === 'friend_request' || n.type === 'friend_accept' || n.type === 'new_message'
  );
}

/** 获取好友相关未读数 */
export function getFriendUnreadCount(): number {
  return getFriendNotifications().filter((n) => !n.read).length;
}
