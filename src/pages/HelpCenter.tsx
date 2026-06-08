import React from 'react';
import { Search, Camera, Brain, BookOpen, ChevronRight, MessageSquare, ArrowRight, Heart } from 'lucide-react';

export default function HelpCenter({ onNavigate }: { onNavigate?: (page: any) => void }) {
  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight font-sans">需要帮助吗？</h1>
          <Heart className="text-secondary fill-secondary" size={40} />
        </div>
        <p className="text-on-surface-variant text-lg font-medium">我们整理了常见问题，也可以直接联系客服小姐姐</p>
      </section>

      {/* Search Box */}
      <section className="mb-20">
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 soul-gradient opacity-10 blur-2xl group-focus-within:opacity-20 transition-opacity rounded-2xl"></div>
          <input 
            type="text" 
            placeholder="搜索您想了解的问题..."
            className="w-full bg-white border-none h-16 pl-14 pr-6 rounded-2xl shadow-xl focus:ring-2 focus:ring-primary-container text-lg placeholder:text-on-surface-variant/40 transition-all"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={24} />
        </div>
      </section>

      {/* Process Steps */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <StepCard 
          icon={<Camera size={32} />} 
          step="1 拍照上传" 
          desc="清晰拍摄题目原图" 
          color="bg-pink-50 text-secondary"
          onClick={() => onNavigate?.('home')}
        />
        <StepCard 
          icon={<Brain size={32} />} 
          step="2 AI分析" 
          desc="智能体精准识别解析" 
          color="bg-violet-50 text-primary"
          onClick={() => onNavigate?.('home')}
        />
        <StepCard 
          icon={<BookOpen size={32} />} 
          step="3 查看解析" 
          desc="多维思路透彻理解" 
          color="bg-rose-50 text-tertiary"
          onClick={() => onNavigate?.('discussion')}
        />
      </section>

      {/* FAQ Section */}
      <section className="bg-surface-container-low rounded-[2.5rem] p-10 mb-16 border border-surface-container">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <span className="w-2 h-8 bg-primary rounded-full"></span>
          常见问题
        </h3>
        <div className="space-y-4">
          <FaqItem label="如何绑定学习账号？" />
          <FaqItem label="积分如何获取？" highlight />
          <FaqItem label="智能体反应慢怎么办？" />
          <FaqItem label="拍照搜题不准确如何反馈？" />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden bg-primary p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between text-white shadow-2xl shadow-primary/30">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="flex items-center gap-8 mb-8 md:mb-0 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <MessageSquare size={40} fill="currentColor" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-3xl font-bold mb-2">还没解决你的问题？</h4>
            <p className="text-primary-container/80 text-lg">点击下方按钮与我们的客服人员实时沟通</p>
          </div>
        </div>

        <button className="bg-gradient-to-r from-secondary to-secondary/80 px-10 py-5 rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 relative z-10">
          <span>联系人工客服</span>
          <ArrowRight size={24} />
        </button>
      </section>
    </div>
  );
}

function StepCard({ icon, step, desc, color, onClick }: { icon: React.ReactNode; step: string; desc: string; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`${color} p-10 rounded-3xl flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-300 shadow-sm border border-white/50 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <div className="font-bold text-lg mb-2">{step}</div>
      <div className="text-on-surface-variant text-sm font-medium">{desc}</div>
    </div>
  );
}

function FaqItem({ label, highlight }: { label: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center p-6 bg-white rounded-2xl hover:shadow-md transition-all cursor-pointer group border border-surface-container">
      <span className={`text-lg font-medium ${highlight ? 'text-secondary' : 'text-on-surface'}`}>{label}</span>
      <ChevronRight className="text-on-surface-variant group-hover:translate-x-1 transition-transform" size={24} />
    </div>
  );
}
