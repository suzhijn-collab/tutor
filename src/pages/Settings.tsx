import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  BookOpen,
  Palette,
  ShieldCheck,
  Edit3,
  Verified,
  Bell,
  Moon,
  Languages,
  Lock,
  ChevronRight,
  Settings as SettingsIcon,
  Check,
  X,
  Hash,
} from 'lucide-react';
import {
  getSettings,
  saveSettings,
  type UserSettings,
} from '@/src/services/settingsService';

const AGENTS = [
  { key: 'math', label: '高数酱', symbol: '∑' },
  { key: 'python', label: 'Py酱', symbol: 'Py' },
  { key: 'torch', label: 'Torch君', symbol: 'T' },
  { key: 'matrix', label: '矩阵妹', symbol: 'M' },
];

const DEFAULT_SETTINGS: UserSettings = {
  nickname: '学习之星Mimi',
  signature: '',
  avatar: 'https://picsum.photos/seed/user/200/200',
  preferredAgent: 'math',
  reviewTime: '20:00',
  pushEnabled: true,
  darkMode: false,
  fontSize: 16,
  email: 'm***@example.com',
  uid: '',
};

export default function Settings({ onNavigate }: { onNavigate?: (page: any) => void }) {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(getSettings().avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarSrc(result);
      updateField('avatar', result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    saveSettings({ ...settings, avatar: avatarSrc });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    const s = getSettings();
    setSettings(s);
    setAvatarSrc(s.avatar);
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-on-surface flex items-center gap-4 font-sans tracking-tight">
            <span className="bg-primary-container p-3 rounded-2xl">
              <SettingsIcon className="text-primary" size={32} />
            </span>
            <span>设置中心</span>
          </h1>
          <p className="text-on-surface-variant mt-4 ml-20 text-lg font-medium">
            定制你的专属 AI 学习空间，让进步更快乐 ✨
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('home')}
          className="px-6 py-2 rounded-full border border-surface-container font-bold text-sm hover:bg-surface-container transition-all"
        >
          返回首页
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Section 1: 个人资料 */}
        <section className="bg-surface-container-low p-10 rounded-[2.5rem] border border-surface-container relative group">
          <div className="flex items-center gap-3 mb-8">
            <User className="text-secondary" size={24} />
            <h2 className="text-2xl font-bold">个人资料</h2>
          </div>

          <div className="flex items-center gap-8 mb-10">
            <div className="relative">
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-white shadow-xl bg-secondary-container object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://picsum.photos/seed/user/200/200';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Edit3 size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-on-surface-variant font-bold opacity-60">
                UID: {settings.uid || '未分配'}
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span>{settings.nickname}</span>
                <Verified className="text-primary fill-primary" size={20} />
              </div>
              <span className="inline-block bg-secondary-container text-secondary text-xs px-3 py-1 rounded-full font-bold">
                黄金会员
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-2">
                昵称
              </label>
              <input
                type="text"
                value={settings.nickname}
                onChange={(e) => updateField('nickname', e.target.value)}
                className="w-full bg-white border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-container shadow-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-2">
                学习签名
              </label>
              <input
                type="text"
                value={settings.signature}
                onChange={(e) => updateField('signature', e.target.value)}
                placeholder="输入一句话鼓励自己吧..."
                className="w-full bg-white border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-container shadow-sm outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 2: 学习设置 */}
        <section className="bg-surface-container-low p-10 rounded-[2.5rem] border border-surface-container">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="text-primary" size={24} />
            <h2 className="text-2xl font-bold">学习设置</h2>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-4 ml-2">
                首选 AI 导师
              </label>
              <div className="grid grid-cols-2 gap-4">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.key}
                    onClick={() => updateField('preferredAgent', agent.key)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      settings.preferredAgent === agent.key
                        ? 'bg-white ring-2 ring-primary shadow-md'
                        : 'bg-white/50 hover:bg-white border border-surface-container'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        settings.preferredAgent === agent.key
                          ? 'bg-primary/10 text-primary'
                          : 'bg-on-surface-variant/10 text-on-surface-variant'
                      }`}
                    >
                      <span className="font-bold">{agent.symbol}</span>
                    </div>
                    <span className="text-sm font-bold">{agent.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-2">
                每日复习时间
              </label>
              <input
                type="time"
                value={settings.reviewTime}
                onChange={(e) => updateField('reviewTime', e.target.value)}
                className="w-full bg-white border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-container shadow-sm outline-none"
              />
            </div>

            <div
              onClick={() => updateField('pushEnabled', !settings.pushEnabled)}
              className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-surface-container cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="text-secondary" size={20} />
                <span className="text-sm font-bold">推送提醒开关</span>
              </div>
              <div
                className={`w-14 h-7 rounded-full relative transition-colors ${
                  settings.pushEnabled ? 'bg-primary' : 'bg-on-surface-variant/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    settings.pushEnabled ? 'right-1' : 'left-1'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: 通用设置 */}
        <section className="bg-surface-container-low p-10 rounded-[2.5rem] border border-surface-container">
          <div className="flex items-center gap-3 mb-8">
            <Palette size={24} />
            <h2 className="text-2xl font-bold">通用设置</h2>
          </div>

          <div className="space-y-8">
            <div
              onClick={() => updateField('darkMode', !settings.darkMode)}
              className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-surface-container cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Moon className="text-on-surface-variant" size={20} />
                <span className="text-sm font-bold">深色模式</span>
              </div>
              <div
                className={`w-14 h-7 rounded-full relative transition-colors ${
                  settings.darkMode ? 'bg-primary' : 'bg-on-surface-variant/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    settings.darkMode ? 'right-1' : 'left-1'
                  }`}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-on-surface-variant ml-2">
                字体大小调节
              </label>
              <div className="flex items-center gap-6 px-2">
                <span className="text-xs font-bold">A</span>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateField('fontSize', Number(e.target.value))}
                  className="flex-grow accent-primary h-1.5 bg-on-surface-variant/20 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold">A</span>
              </div>
              <div className="text-center text-xs text-on-surface-variant">
                当前：{settings.fontSize}px
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-surface-container">
              <div className="flex items-center gap-3">
                <Languages className="text-on-surface-variant" size={20} />
                <span className="text-sm font-bold">界面语言</span>
              </div>
              <span className="text-sm text-primary font-black">简体中文</span>
            </div>
          </div>
        </section>

        {/* Section 4: 账户安全 */}
        <section className="bg-surface-container-low p-10 rounded-[2.5rem] border border-surface-container">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-red-500" size={24} />
            <h2 className="text-2xl font-bold">账户安全</h2>
          </div>

          <div className="space-y-4">
            <div className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-surface-container shadow-sm">
              <div className="flex items-center gap-4">
                <Hash className="text-primary" size={20} />
                <div className="text-left">
                  <div className="text-sm font-bold">账号 ID</div>
                  <div className="text-xs text-on-surface-variant font-medium font-mono tracking-wider">
                    {settings.uid || '请先登录'}
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full flex items-center justify-between p-5 bg-white rounded-2xl hover:bg-surface-container transition-all group border border-surface-container shadow-sm">
              <div className="flex items-center gap-4">
                <Lock className="text-on-surface-variant group-hover:text-primary transition-colors" size={20} />
                <span className="text-sm font-bold">重置密码</span>
              </div>
              <ChevronRight className="text-on-surface-variant" size={20} />
            </button>

            <div className="pt-6">
              <button className="w-full py-4 border-2 border-red-100 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-50 transition-colors">
                注销账户
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Buttons */}
      <div className="mt-16 flex items-center justify-end gap-8">
        <button
          onClick={handleCancel}
          className="px-10 py-4 text-on-surface-variant font-bold hover:text-on-surface transition-colors"
        >
          取消修改
        </button>
        <button
          onClick={handleSave}
          className="px-12 py-5 soul-gradient text-white rounded-full font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check size={20} />
              已保存
            </>
          ) : (
            '保存所有设置'
          )}
        </button>
      </div>
    </div>
  );
}
