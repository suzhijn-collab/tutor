import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  UserPlus,
  Users,
  Send,
  X,
  Check,
  Clock,
  UserX,
  Search,
  Bell,
  ThumbsUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  getFriends,
  sendFriendRequest,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  removeFriend,
  AVAILABLE_USERS,
  type Friend,
  type FriendRequest,
} from '@/src/services/friendService';
import { getMessages, sendMessage, type ChatMessage } from '@/src/services/chatService';
import { getUserDisplayName, getUserAvatar } from '@/src/services/settingsService';
import {
  getFriendNotifications,
  getFriendUnreadCount,
  markAllRead,
  markRead,
  type AppNotification,
} from '@/src/services/notificationService';

function getNotificationIcon(type: AppNotification['type']) {
  switch (type) {
    case 'friend_request':
      return <UserPlus size={14} className="text-secondary" />;
    case 'friend_accept':
      return <Check size={14} className="text-green-500" />;
    case 'new_message':
      return <MessageSquare size={14} className="text-primary" />;
    default:
      return <Bell size={14} className="text-on-surface-variant" />;
  }
}

function getNotificationBg(type: AppNotification['type']): string {
  switch (type) {
    case 'friend_request':
      return 'bg-secondary/10';
    case 'friend_accept':
      return 'bg-green-50';
    case 'new_message':
      return 'bg-primary/10';
    default:
      return 'bg-surface';
  }
}

export default function Chat({ onNavigate }: { onNavigate?: (page: any) => void }) {
  const currentUser = getUserDisplayName();
  const currentAvatar = getUserAvatar();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingReqs, setPendingReqs] = useState<FriendRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  // 通知面板
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [friendNotifs, setFriendNotifs] = useState<AppNotification[]>([]);
  const [friendUnread, setFriendUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭通知面板
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const refreshAll = () => {
    setFriends(getFriends());
    setPendingReqs(getPendingRequests(currentUser));
    setFriendNotifs(getFriendNotifications());
    setFriendUnread(getFriendUnreadCount());
  };

  useEffect(() => {
    refreshAll();
  }, [currentUser]);

  useEffect(() => {
    if (selectedFriend) {
      setMessages(getMessages(currentUser, selectedFriend.name));
    }
  }, [selectedFriend, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshFriends = () => {
    const f = getFriends();
    setFriends(f);
  };

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    const msgs = getMessages(currentUser, friend.name);
    setMessages(msgs);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedFriend) return;
    const updated = sendMessage(
      currentUser,
      currentAvatar,
      selectedFriend.name,
      selectedFriend.avatar,
      trimmed,
    );
    setMessages(updated);
    setInput('');
  };

  const handleSendRequest = (to: string, toAvatar: string) => {
    sendFriendRequest(currentUser, currentAvatar, to, toAvatar);
    refreshFriends();
    setShowAddModal(false);
    refreshAll();
  };

  const handleAccept = (reqId: string) => {
    const result = acceptRequest(reqId);
    const reqs = getPendingRequests(currentUser);
    setPendingReqs(reqs);
    setFriends(result.friends);
    refreshAll();
  };

  const handleReject = (reqId: string) => {
    rejectRequest(reqId);
    const reqs = getPendingRequests(currentUser);
    setPendingReqs(reqs);
    refreshAll();
  };

  const handleRemoveFriend = (name: string) => {
    removeFriend(name);
    refreshFriends();
    if (selectedFriend?.name === name) setSelectedFriend(null);
  };

  const handleBellClick = () => {
    if (!showNotifPanel) {
      refreshAll();
    }
    setShowNotifPanel(!showNotifPanel);
  };

  const handleMarkAllFriendRead = () => {
    markAllRead();
    refreshAll();
  };

  const handleNotifClick = (notif: AppNotification) => {
    markRead(notif.id);
    refreshAll();
    // 如果有好友申请，展开请求列表
    if (notif.type === 'friend_request') {
      setShowRequests(true);
    }
    // 如果是新消息，尝试选中该好友
    if (notif.type === 'new_message' && notif.fromUser) {
      const friend = friends.find((f) => f.name === notif.fromUser);
      if (friend) {
        handleSelectFriend(friend);
      }
    }
    setShowNotifPanel(false);
  };

  // 综合未读数 = 待处理申请 + 好友通知未读
  const totalUnread = pendingReqs.length + friendUnread;

  // 筛选未添加的用户
  const friendNames = new Set(friends.map((f) => f.name));
  const availableToAdd = AVAILABLE_USERS.filter(
    (u) => u.name !== currentUser && !friendNames.has(u.name),
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] max-w-6xl mx-auto">
      {/* Left Panel: Friends */}
      <div className="w-80 bg-surface-container-low rounded-l-[2.5rem] p-6 flex flex-col border-r border-surface-container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-on-surface font-sans">好友</h2>
          <div className="flex gap-1">
            {/* 通知铃铛 */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleBellClick}
                className={`relative p-2 rounded-full transition-colors ${
                  totalUnread > 0
                    ? 'text-secondary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Bell size={18} />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>

              {/* 通知下拉面板 */}
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute left-0 top-11 w-80 max-h-[420px] bg-white rounded-2xl shadow-2xl border border-surface-container overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-surface-container">
                    <h3 className="text-sm font-black text-on-surface font-sans">好友动态</h3>
                    {friendUnread > 0 && (
                      <button
                        onClick={handleMarkAllFriendRead}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <Check size={12} />
                        全部已读
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-[360px]">
                    {/* 待处理好友申请 */}
                    {pendingReqs.length > 0 && (
                      <div className="border-b border-surface-container/50">
                        <div className="px-5 py-2 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
                          待处理申请 ({pendingReqs.length})
                        </div>
                        {pendingReqs.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white px-5 py-3 flex items-center gap-3"
                          >
                            <img
                              src={req.fromAvatar}
                              alt={req.from}
                              className="w-9 h-9 rounded-full"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold">{req.from}</div>
                              <div className="text-[10px] text-on-surface-variant/60">
                                {req.timestamp}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAccept(req.id)}
                                className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 好友通知列表 */}
                    {friendNotifs.length === 0 && pendingReqs.length === 0 ? (
                      <div className="py-12 text-center text-on-surface-variant/40 text-sm">
                        <Bell size={32} className="mx-auto mb-3 opacity-30" />
                        暂无好友动态
                      </div>
                    ) : (
                      <>
                        {friendNotifs.length > 0 && (
                          <div className="px-5 py-2 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
                            最近动态
                          </div>
                        )}
                        {friendNotifs.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-surface transition-colors border-b border-surface-container/50 ${
                              !n.read ? 'bg-primary/[0.03]' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotificationBg(n.type)}`}>
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-on-surface-variant/50 mt-0.5">{n.timestamp}</p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-1.5"></span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              title="添加好友"
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {friends.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant/50 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              还没有好友，点击右上角添加
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.name}
                onClick={() => handleSelectFriend(friend)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  selectedFriend?.name === friend.name
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-bold truncate">{friend.name}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className="flex-1 flex flex-col bg-white rounded-r-[2.5rem]">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-8 py-4 border-b border-surface-container">
              <img
                src={selectedFriend.avatar}
                alt={selectedFriend.name}
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="font-bold text-sm">{selectedFriend.name}</div>
              </div>
              <button
                onClick={() => handleRemoveFriend(selectedFriend.name)}
                className="p-2 rounded-full text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="删除好友"
              >
                <UserX size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-on-surface-variant/40 mt-20">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">开始聊天吧！</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === currentUser;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.sender}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-on-surface">
                            {msg.sender}
                          </span>
                          <span className="text-[10px] text-on-surface-variant/40">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? 'soul-gradient text-white rounded-tr-md'
                              : 'bg-surface-container-low text-on-surface rounded-tl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-8 py-4 border-t border-surface-container">
              <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-5 py-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="输入消息…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="text-primary disabled:text-on-surface-variant/30 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-on-surface-variant/30">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">选择好友开始聊天</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-on-surface font-sans">添加好友</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-surface-container transition-colors"
              >
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-3.5 text-on-surface-variant/50" />
              <input
                type="text"
                placeholder="搜索用户…"
                className="w-full bg-surface-container-low rounded-xl pl-11 pr-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              {availableToAdd.length === 0 ? (
                <p className="text-center text-on-surface-variant/50 text-sm py-8">
                  没有更多可添加的用户
                </p>
              ) : (
                availableToAdd.map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold">{user.name}</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.name, user.avatar)}
                      className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-full hover:bg-primary/20 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
