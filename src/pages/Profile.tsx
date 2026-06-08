import React from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Edit3,
  ChevronRight,
  Star,
  Zap,
  BookOpen,
  Brain,
  Hash,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getSettings, getUserDisplayName, getUserAvatar } from '../services/settingsService';

export default function Profile({ onNavigate }: { onNavigate?: (page: any) => void }) {
  const settings = getSettings();
  const displayName = getUserDisplayName();
  const avatar = getUserAvatar();
  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="relative rounded-[3rem] overflow-hidden bg-white shadow-xl border border-surface-container-low">
        {/* Cover Image */}
        <div className="h-48 w-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 relative">
          <div className="absolute inset-0 soul-gradient opacity-10"></div>
          <button className="absolute bottom-4 right-8 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2">
            <Edit3 size={14} />
            更换封面
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-10 pb-10 -mt-12 relative z-10 flex flex-col md:flex-row items-end gap-6">
          <div className="relative">
            <img 
              src={avatar}
              alt="Avatar" 
              className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-md">
              <Zap size={18} fill="currentColor" />
            </div>
          </div>

          <div className="flex-1 mb-2">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-on-surface font-sans">{displayName}</h2>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Lv.12 学霸</span>
            </div>
            <p className="text-on-surface-variant font-medium flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> 北京 · 清华大学</span>
              <span className="flex items-center gap-1"><Hash size={14} /> 账号 ID: {settings.uid || '未分配'}</span>
            </p>
            <p className="mt-3 text-on-surface-variant italic text-sm">{settings.signature || '“ 既然选择了远方，便只顾风雨兼程。正在攻克《高等数学》重难点... ”'}</p>
          </div>

          <div className="flex gap-3 mb-2">
            <button 
              onClick={() => onNavigate?.('settings')}
              className="px-6 py-3 soul-gradient text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Edit3 size={18} />
              编辑资料
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Clock className="text-primary" />} 
          label="累计学习时长" 
          value="128" 
          unit="小时" 
          trend="+12% 本周"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-secondary" />} 
          label="已解决问题" 
          value="452" 
          unit="个" 
          trend="+24 今天"
        />
        <StatCard 
          icon={<TrendingUp className="text-primary" />} 
          label="平均正确率" 
          value="86.5" 
          unit="%" 
          trend="+2.1% 较上月"
        />
        <StatCard 
          icon={<Calendar className="text-secondary" />} 
          label="连续打卡" 
          value="15" 
          unit="天" 
          trend="保持住！"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity & Tutors */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-surface-container-low">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-on-surface font-sans flex items-center gap-2">
                <Zap size={20} className="text-secondary" />
                最近动态
              </h3>
              <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                查看全部 <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <ActivityItem 
                type="chat"
                title="与 高数酱 讨论了“拉格朗日中值定理”"
                time="2小时前"
                description="深入探讨了定理的几何意义及其在不等式证明中的应用。"
              />
              <ActivityItem 
                type="wrong"
                title="在 错题本 中添加了 3 道线性代数题目"
                time="昨天 18:30"
                description="涉及特征值与特征向量的计算，已标注为“重点复习”。"
              />
              <ActivityItem 
                type="badge"
                title="获得了“深夜学霸”勋章"
                time="3天前"
                description="连续 7 天在凌晨 12 点后仍有学习记录。"
              />
            </div>
          </div>

          {/* My Tutors */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-surface-container-low">
            <h3 className="text-xl font-black text-on-surface font-sans mb-8">我的 AI 导师</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TutorCard name="高数酱" role="微积分专家" interactions={124} level={5} />
              <TutorCard name="Py酱" role="数据分析向导" interactions={86} level={3} />
            </div>
          </div>
        </div>

        {/* Right Column: Achievements & Goal */}
        <div className="space-y-8">
          {/* Achievements */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-surface-container-low">
            <h3 className="text-xl font-black text-on-surface font-sans mb-8 flex items-center gap-2">
              <Award size={20} className="text-primary" />
              成就勋章
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Badge icon={<Star size={20} />} label="初露锋芒" active />
              <Badge icon={<Zap size={20} />} label="效率达人" active />
              <Badge icon={<BookOpen size={20} />} label="博览群书" active />
              <Badge icon={<Award size={20} />} label="满分选手" />
              <Badge icon={<TrendingUp size={20} />} label="进步神速" />
              <Badge icon={<Calendar size={20} />} label="全勤标兵" />
            </div>
          </div>

          {/* Current Goal */}
          <div className="soul-gradient rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
              <TrendingUp size={120} />
            </div>
            <h3 className="text-xl font-black font-sans mb-4 relative z-10">当前目标</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm font-bold">
                <span>期末高数冲刺 A+</span>
                <span>75%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  className="h-full bg-white rounded-full"
                ></motion.div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                距离考试还有 12 天。建议加强“多元函数微分学”部分的练习。
              </p>
              <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm shadow-lg hover:bg-opacity-90 transition-all">
                开始今日计划
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, trend }: { icon: React.ReactNode, label: string, value: string, unit: string, trend: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-surface-container-low hover:translate-y-[-4px] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-surface rounded-2xl">
          {icon}
        </div>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-black text-on-surface font-sans tracking-tight">{value}</span>
        <span className="text-sm font-bold text-on-surface-variant">{unit}</span>
      </div>
      <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">{trend}</div>
    </div>
  );
}

function ActivityItem({ type, title, time, description }: { type: 'chat' | 'wrong' | 'badge', title: string, time: string, description: string }) {
  const getIcon = () => {
    switch (type) {
      case 'chat': return <MessageSquare size={16} className="text-primary" />;
      case 'wrong': return <BookOpen size={16} className="text-secondary" />;
      case 'badge': return <Award size={16} className="text-primary" />;
    }
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center border border-surface-container-low group-hover:soul-gradient group-hover:text-white transition-all">
          {getIcon()}
        </div>
        <div className="w-0.5 flex-1 bg-surface-container-low my-2"></div>
      </div>
      <div className="flex-1 pb-6">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">{title}</h4>
          <span className="text-xs text-on-surface-variant">{time}</span>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TutorCard({ name, role, interactions, level }: { name: string, role: string, interactions: number, level: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface border border-surface-container-low hover:bg-white hover:shadow-md transition-all cursor-pointer group">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:soul-gradient group-hover:text-white transition-all">
        <Brain size={28} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-bold text-on-surface">{name}</span>
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Lv.{level}</span>
        </div>
        <div className="text-xs text-on-surface-variant mb-1">{role}</div>
        <div className="text-[10px] text-on-surface-variant/60">互动次数: {interactions}</div>
      </div>
      <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  );
}

function Badge({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${
        active 
          ? 'soul-gradient text-white shadow-lg shadow-primary/20' 
          : 'bg-surface text-on-surface-variant/40 grayscale'
      }`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{label}</span>
    </div>
  );
}

function MessageSquare({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
