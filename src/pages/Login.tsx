import React, { useState } from 'react';
import { ArrowRight, Sparkles, User, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoBackground from '../components/VideoBackground';
import { videoBackgroundConfig } from '../config/videoConfig';
import { getSettings, generateUniqueUID, initUserSettings, isNicknameTaken, setCurrentUserPhone } from '../services/settingsService';

// 固定登录凭据
const FIXED_ACCOUNT = '15622235483';
const FIXED_PASSWORD = 'Qq03099721..';
const FIXED_NAME = '雪之下雪乃';

const USERS_STORAGE_KEY = 'tutor_registered_users';

interface RegisteredUser {
  account: string;
  password: string;
  nickname: string;
  uid: string;
}

function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: RegisteredUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

type FormMode = 'login' | 'register';

export default function Login({ onLogin, onNavigate }: { onLogin: () => void, onNavigate?: (page: any) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<FormMode>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setAccount('');
    setPassword('');
    setNickname('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleLogin = () => {
    // 先检查固定账号
    if (account === FIXED_ACCOUNT && password === FIXED_PASSWORD) {
      // 先设置当前用户，确保 getSettings() 能读取到该用户已有的 UID
      setCurrentUserPhone(FIXED_ACCOUNT);
      const currentSettings = getSettings();
      const uid = currentSettings.uid || generateUniqueUID();
      // 绑定手机号 ↔ 昵称 ↔ UID
      initUserSettings(FIXED_ACCOUNT, FIXED_NAME, uid);
      onLogin();
      return;
    }
    // 再检查已注册用户
    const users = getRegisteredUsers();
    const found = users.find(u => u.account === account && u.password === password);
    if (found) {
      // 绑定手机号 ↔ 昵称 ↔ UID（从注册记录恢复）
      initUserSettings(found.account, found.nickname, found.uid);
      onLogin();
      return;
    }
    setError('账号或密码错误，请重试');
  };

  const handleRegister = () => {
    // 校验
    if (!account.trim() || !password.trim() || !nickname.trim() || !confirmPassword.trim()) {
      setError('请填写所有字段');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(account.trim())) {
      setError('请输入正确的手机号');
      return;
    }
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    // 检查账号是否已注册
    const users = getRegisteredUsers();
    if (users.find(u => u.account === account.trim())) {
      setError('该账号已被注册');
      return;
    }
    if (account.trim() === FIXED_ACCOUNT) {
      setError('该账号已被注册');
      return;
    }
    // 检查昵称是否已被使用（固定用户 + 已注册用户 + 所有历史用户设置）
    if (nickname.trim() === FIXED_NAME) {
      setError('该昵称已被使用');
      return;
    }
    if (isNicknameTaken(nickname.trim())) {
      setError('该昵称已被使用');
      return;
    }
    // 生成全局唯一 UID
    const uid = generateUniqueUID();
    // 保存用户（手机号、昵称、UID 三者绑定）
    users.push({ account: account.trim(), password, nickname: nickname.trim(), uid });
    saveRegisteredUsers(users);
    setSuccess('注册成功！正在为你跳转...');
    // 延迟自动登录
    setTimeout(() => {
      // 绑定手机号 ↔ 昵称 ↔ UID
      initUserSettings(account.trim(), nickname.trim(), uid);
      onLogin();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-y-auto font-serif">
      {/* Video Background */}
      <div className="fixed inset-0 z-0" onClick={() => isExpanded && setIsExpanded(false)}>
        <VideoBackground
          videoSrc={{
            src8k: videoBackgroundConfig.login.src8k,
            src4k: videoBackgroundConfig.login.src4k,
            src2k: videoBackgroundConfig.login.src2k,
            default: videoBackgroundConfig.login.default,
          }}
          placeholder={videoBackgroundConfig.login.placeholder}
          overlayOpacity={videoBackgroundConfig.login.overlayOpacity}
        />
        <div className={`absolute inset-0 transition-colors duration-700 ${isExpanded ? 'bg-black/20' : 'bg-transparent'}`}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div 
                key="trigger"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center cursor-pointer group"
                onClick={() => setIsExpanded(true)}
              >
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 group-hover:bg-white/20 transition-all duration-500 group-hover:scale-110">
                  <Sparkles className="text-white w-10 h-10 animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white font-sans tracking-tighter mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  智课通 AI Tutor
                </h1>
                <p className="text-white/90 font-bold text-xl drop-shadow-lg mb-8">开启你的智能学习之旅</p>
                <div className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/30 text-white font-bold hover:bg-white/20 transition-all">
                  点击进入 <ArrowRight size={18} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={mode}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white font-sans tracking-tight drop-shadow-md">智课通 AI Tutor</h1>
                </div>

                {/* 登录/注册 Tab 切换 */}
                <div className="flex mb-4 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
                  <button
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                      mode === 'login'
                        ? 'soul-gradient text-white shadow-lg'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    登录
                  </button>
                  <button
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      mode === 'register'
                        ? 'soul-gradient text-white shadow-lg'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <UserPlus size={16} />
                    注册
                  </button>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 账号 */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/90 ml-1 drop-shadow-sm">账号（手机号）</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input 
                          type="text" 
                          value={account}
                          onChange={(e) => { setAccount(e.target.value); setError(''); setSuccess(''); }}
                          placeholder="请输入手机号"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary transition-all text-white placeholder:text-white/20 bg-white/5"
                        />
                      </div>
                    </div>

                    {/* 注册模式：昵称 */}
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-bold text-white/90 ml-1 drop-shadow-sm">昵称</label>
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                          <input 
                            type="text" 
                            value={nickname}
                            onChange={(e) => { setNickname(e.target.value); setError(''); setSuccess(''); }}
                            placeholder="给自己取个名字吧"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary transition-all text-white placeholder:text-white/20 bg-white/5"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 密码 */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/90 ml-1 drop-shadow-sm">密码</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); setSuccess(''); }}
                          placeholder="请输入密码"
                          className="w-full pl-12 pr-12 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary transition-all text-white placeholder:text-white/20 bg-white/5"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* 注册模式：确认密码 */}
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-bold text-white/90 ml-1 drop-shadow-sm">确认密码</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                          <input 
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccess(''); }}
                            placeholder="请再次输入密码"
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary transition-all text-white placeholder:text-white/20 bg-white/5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                          >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* 错误提示 */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm text-center font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* 成功提示 */}
                    {success && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-400 text-sm text-center font-medium"
                      >
                        {success}
                      </motion.p>
                    )}

                    <button 
                      type="submit"
                      className="w-full soul-gradient py-4 rounded-full text-white text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {mode === 'login' ? '登录' : '注册'} <ArrowRight size={20} />
                    </button>
                  </form>

                  {/* 底部切换链接 */}
                  <div className="mt-5 text-center">
                    {mode === 'login' ? (
                      <p className="text-white/50 text-sm">
                        还没有账号？{' '}
                        <button
                          onClick={() => switchMode('register')}
                          className="text-white font-bold hover:underline transition-all"
                        >
                          立即注册
                        </button>
                      </p>
                    ) : (
                      <p className="text-white/50 text-sm">
                        已有账号？{' '}
                        <button
                          onClick={() => switchMode('login')}
                          className="text-white font-bold hover:underline transition-all"
                        >
                          立即登录
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative w-full py-8 text-center space-y-2 z-10">
        <div className="text-lg font-bold text-white/80 font-sans drop-shadow-md">智课通 AI Tutor</div>
        <div className="flex justify-center gap-6 text-white/60 text-sm">
          <a href="#" className="hover:text-white transition-colors">隐私政策</a>
          <a href="#" className="hover:text-white transition-colors">服务条款</a>
          <button 
            onClick={() => {
              onLogin();
              onNavigate?.('help');
            }}
            className="hover:text-white transition-colors"
          >
            帮助中心
          </button>
        </div>
        <p className="text-white/40 text-xs">&copy; 2026 智课通 AI Tutor. 专为求知者打造</p>
      </footer>
    </div>
  );
}
