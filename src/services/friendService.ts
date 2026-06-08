import { addNotification } from './notificationService';

export interface FriendRequest {
  id: string;
  from: string;
  fromAvatar: string;
  to: string;
  toAvatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Friend {
  name: string;
  avatar: string;
  addedAt: string;
}

const REQUESTS_KEY = 'tutor_friend_requests';
const FRIENDS_KEY = 'tutor_friends';

/** 可添加的预设用户（模拟其他同学） */
export const AVAILABLE_USERS = [
  { name: '高数酱', avatar: 'https://picsum.photos/seed/bot1/100/100' },
  { name: 'Py酱', avatar: 'https://picsum.photos/seed/bot2/100/100' },
  { name: 'Torch君', avatar: 'https://picsum.photos/seed/bot3/100/100' },
  { name: '矩阵妹', avatar: 'https://picsum.photos/seed/bot4/100/100' },
  { name: '李同学', avatar: 'https://picsum.photos/seed/s1/100/100' },
  { name: '王学霸', avatar: 'https://picsum.photos/seed/s2/100/100' },
  { name: '赵大神', avatar: 'https://picsum.photos/seed/s3/100/100' },
];

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

function getRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequests(requests: FriendRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFriends(friends: Friend[]): void {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
}

/** 发送好友申请 */
export function sendFriendRequest(
  from: string,
  fromAvatar: string,
  to: string,
  toAvatar: string
): FriendRequest[] {
  const requests = getRequests();
  // 防止重复申请
  const existing = requests.find(
    (r) => r.from === from && r.to === to && r.status === 'pending'
  );
  if (existing) return requests;

  const req: FriendRequest = {
    id: generateId(),
    from,
    fromAvatar,
    to,
    toAvatar,
    status: 'pending',
    timestamp: getBeijingTime(),
  };
  requests.push(req);
  saveRequests(requests);
  // 通知接收者
  addNotification({
    type: 'friend_request',
    message: `${from} 向你发送了好友申请`,
    fromUser: from,
    fromAvatar: fromAvatar,
    targetId: req.id,
  });
  return requests;
}

/** 获取发给某用户的待处理申请 */
export function getPendingRequests(userName: string): FriendRequest[] {
  return getRequests().filter((r) => r.to === userName && r.status === 'pending');
}

/** 获取某用户发出的所有申请 */
export function getSentRequests(userName: string): FriendRequest[] {
  return getRequests().filter((r) => r.from === userName);
}

/** 接受好友申请 */
export function acceptRequest(requestId: string): { requests: FriendRequest[]; friends: Friend[] } {
  const requests = getRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req || req.status !== 'pending') {
    return { requests, friends: getFriends() };
  }

  req.status = 'accepted';
  saveRequests(requests);

  // 双向添加好友
  const friends = getFriends();
  if (!friends.find((f) => f.name === req.from)) {
    friends.push({ name: req.from, avatar: req.fromAvatar, addedAt: getBeijingTime() });
  }
  if (!friends.find((f) => f.name === req.to)) {
    friends.push({ name: req.to, avatar: req.toAvatar, addedAt: getBeijingTime() });
  }
  saveFriends(friends);

  return { requests, friends };
}

/** 拒绝好友申请 */
export function rejectRequest(requestId: string): FriendRequest[] {
  const requests = getRequests();
  const req = requests.find((r) => r.id === requestId);
  if (req) req.status = 'rejected';
  saveRequests(requests);
  return requests;
}

/** 删除好友 */
export function removeFriend(friendName: string): Friend[] {
  const friends = getFriends().filter((f) => f.name !== friendName);
  saveFriends(friends);
  return friends;
}
