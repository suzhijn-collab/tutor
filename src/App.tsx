import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  MessageSquare, 
  BookOpen, 
  Users, 
  HelpCircle, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Calculator,
  Code,
  Brain,
  Grid3X3,
  User,
  X,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserDisplayName, getUserAvatar, clearCurrentUserPhone } from '@/src/services/settingsService';
import { getNotifications, getUnreadCount, markAllRead, markRead, type AppNotification } from '@/src/services/notificationService';

// Pages
import Home from './pages/Home';
import WrongQuestions from './pages/WrongQuestions';
import Discussion from './pages/Discussion';
import HelpCenter from './pages/HelpCenter';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

type Page = 'home' | 'wrong-questions' | 'discussion' | 'help' | 'settings' | 'login' | 'profile' | 'chat';
type Agent = 'math' | 'python' | 'torch' | 'matrix';

function getNotificationIcon(type: AppNotification['type']) {
  switch (type) {
    case 'post_like':
    case 'comment_like':
      return <ThumbsUp size={14} className="text-primary" />;
    case 'new_comment':
    case 'new_message':
      return <MessageCircle size={14} className="text-secondary" />;
    case 'friend_request':
    case 'friend_accept':
      return <UserPlus size={14} className="text-secondary" />;
  }
}

function getNotificationColor(type: AppNotification['type']): string {
  switch (type) {
    case 'post_like':
    case 'comment_like':
      return 'bg-primary/10';
    case 'new_comment':
    case 'new_message':
      return 'bg-secondary/10';
    case 'friend_request':
    case 'friend_accept':
      return 'bg-secondary/10';
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [activeAgent, setActiveAgent] = useState<Agent>('math');
  const [userName, setUserName] = useState(getUserDisplayName());
  const [userAvatar, setUserAvatar] = useState(getUserAvatar());

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 通知
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭通知面板
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // 刷新通知
  const refreshNotifications = () => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  // 页面切换时刷新用户信息和通知
  useEffect(() => {
    if (currentPage !== 'login') {
      setUserName(getUserDisplayName());
      setUserAvatar(getUserAvatar());
      refreshNotifications();
    }
  }, [currentPage]);

  const handleLogin = () => {
    setUserName(getUserDisplayName());
    setUserAvatar(getUserAvatar());
    // 清除上次的活跃对话，确保登录后展示新对话框
    localStorage.removeItem('tutor_active_ids');
    setActiveAgent('math');
    setCurrentPage('home');
  };

  const handleLogout = () => {
    clearCurrentUserPhone();
    setCurrentPage('login');
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setCurrentPage('discussion');
    }
  };

  const handleBellClick = () => {
    if (!showNotifications) {
      refreshNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllRead = () => {
    markAllRead();
    refreshNotifications();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markRead(notif.id);
    refreshNotifications();
    // 根据类型跳转
    if (notif.type === 'friend_request' || notif.type === 'new_message' || notif.type === 'friend_accept') {
      setCurrentPage('chat');
    } else {
      setCurrentPage('discussion');
    }
    setShowNotifications(false);
  };

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} onNavigate={navigateTo} />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex flex-col h-screen w-72 bg-[#f7eaf3] rounded-r-[3rem] py-8 px-4 z-50 shadow-xl">
        <div className="px-4 mb-10">
          <h1 className="text-xl font-black text-primary font-sans tracking-tight">AI Agents</h1>
          <p className="text-xs text-on-surface-variant font-medium">你的专属数字导师</p>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={<Calculator size={20} />} 
            label="高数酱" 
            active={currentPage === 'home' && activeAgent === 'math'} 
            onClick={() => { setCurrentPage('home'); setActiveAgent('math'); }}
            subtitle="微积分 & 线代专家"
          />
          <SidebarItem 
            icon={<Code size={20} />} 
            label="Py酱" 
            active={currentPage === 'home' && activeAgent === 'python'}
            onClick={() => { setCurrentPage('home'); setActiveAgent('python'); }}
            subtitle="数据分析小能手"
          />
          <SidebarItem 
            icon={<Brain size={20} />} 
            label="Torch君" 
            active={currentPage === 'home' && activeAgent === 'torch'}
            onClick={() => { setCurrentPage('home'); setActiveAgent('torch'); }}
            subtitle="深度学习炼丹师"
          />
          <SidebarItem 
            icon={<Grid3X3 size={20} />} 
            label="矩阵妹" 
            active={currentPage === 'home' && activeAgent === 'matrix'}
            onClick={() => { setCurrentPage('home'); setActiveAgent('matrix'); }}
            subtitle="向量空间向导"
          />
        </nav>

        <div className="mt-auto space-y-2">
          <SidebarItem 
            icon={<Users size={20} />} 
            label="好友" 
            active={currentPage === 'chat'} 
            onClick={() => setCurrentPage('chat')}
            subtitle="聊天 & 社交"
          />
          
          <SidebarItem 
            icon={<User size={20} />} 
            label="个人中心" 
            active={currentPage === 'profile'} 
            onClick={() => setCurrentPage('profile')}
          />
          <SidebarItem 
            icon={<LogOut size={20} />} 
            label="退出登录" 
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-72 flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 w-full bg-surface/80 backdrop-blur-md z-40 border-b border-surface-container-low">
          <div className="flex justify-between items-center w-full px-8 py-3 max-w-[1920px] mx-auto">
            <div className="flex items-center gap-12">
              <span className="text-2xl font-black text-primary font-sans">智课通</span>
              <nav className="hidden md:flex items-center gap-6">
                <NavBtn active={currentPage === 'home'} onClick={() => setCurrentPage('home')}>首页</NavBtn>
                <NavBtn active={currentPage === 'wrong-questions'} onClick={() => setCurrentPage('wrong-questions')}>错题本</NavBtn>
                <NavBtn active={currentPage === 'discussion'} onClick={() => setCurrentPage('discussion')}>讨论区</NavBtn>
                <NavBtn active={currentPage === 'help'} onClick={() => setCurrentPage('help')}>帮助中心</NavBtn>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 搜索栏 */}
              <div className="relative hidden lg:block">
                <input 
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="搜索帖子…" 
                  className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-12 w-64 focus:ring-2 focus:ring-primary-container text-sm"
                />
                <Search className="absolute left-3 top-2.5 text-on-surface-variant" size={16} />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                    className="absolute right-3 top-2.5 text-on-surface-variant/50 hover:text-on-surface-variant"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* 通知铃铛 */}
              <div ref={notificationRef} className="relative">
                <button
                  onClick={handleBellClick}
                  className="p-2 rounded-full hover:bg-surface-container transition-all relative"
                >
                  <Bell size={20} className="text-on-surface-variant" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* 通知下拉面板 */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 max-h-[420px] bg-white rounded-2xl shadow-2xl border border-surface-container overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-5 py-3 border-b border-surface-container">
                      <h3 className="text-sm font-black text-on-surface font-sans">通知</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          <Check size={12} />
                          全部已读
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-[360px]">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-on-surface-variant/40 text-sm">
                          <Bell size={32} className="mx-auto mb-3 opacity-30" />
                          暂无通知
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-surface transition-colors border-b border-surface-container/50 ${
                              !n.read ? 'bg-primary/[0.03]' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotificationColor(n.type)}`}>
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
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <button 
                className="p-2 rounded-full hover:bg-surface-container transition-all"
                onClick={() => setCurrentPage('settings')}
              >
                <Settings size={20} className="text-on-surface-variant" />
              </button>
              <div 
                className="flex items-center gap-3 pl-2 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setCurrentPage('profile')}
              >
                <span className="text-sm font-bold">{userName}</span>
                <img 
                  src={userAvatar} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-primary-container object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentPage === 'home' && <Home onNavigate={navigateTo} activeAgent={activeAgent} />}
              {currentPage === 'wrong-questions' && <WrongQuestions />}
              {currentPage === 'discussion' && <Discussion searchQuery={searchQuery} onClearSearch={() => { setSearchQuery(''); setSearchInput(''); }} />}
              {currentPage === 'help' && <HelpCenter onNavigate={navigateTo} />}
              {currentPage === 'settings' && <SettingsPage onNavigate={navigateTo} />}
              {currentPage === 'profile' && <Profile onNavigate={navigateTo} />}
              {currentPage === 'chat' && <Chat onNavigate={navigateTo} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, subtitle }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, subtitle?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 hover:translate-x-1 ${
        active 
          ? 'soul-gradient text-white shadow-lg shadow-primary/20' 
          : 'text-on-surface hover:bg-surface'
      }`}
    >
      <div className={active ? 'text-white' : 'text-primary'}>{icon}</div>
      <div className="flex flex-col items-start">
        <span className="font-bold text-sm">{label}</span>
        {subtitle && <span className={`text-[10px] ${active ? 'text-white/80' : 'text-on-surface-variant'}`}>{subtitle}</span>}
      </div>
    </button>
  );
}

function NavBtn({ children, active, onClick }: { children: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
        active 
          ? 'soul-gradient text-white shadow-sm' 
          : 'text-on-surface hover:bg-surface-container-low'
      }`}
    >
      {children}
    </button>
  );
}
