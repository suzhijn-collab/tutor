import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Send, ImagePlus, Trash2, History, Archive, BookOpen, Code, Brain, Grid3X3, Loader2, MessageCircle, Bookmark, X } from 'lucide-react';
import { chatWithDeepSeek, analyzeImageWithDeepSeek, ChatMessage } from '@/src/services/deepseek';
import { saveWrongQuestion } from '@/src/services/wrongQuestions';
import MessageContent from '@/src/components/MessageContent';

const agents = {
  math: {
    name: '高数酱',
    icon: <Calculator size={24} />,
    subtitle: '微积分 & 线代专家',
    placeholder: '问问高数酱... 例如：帮我求这个函数的导数',
    image: 'https://picsum.photos/seed/math/400/400'
  },
  python: {
    name: 'Py酱',
    icon: <Code size={24} />,
    subtitle: '数据分析小能手',
    placeholder: '问问 Py 酱... 例如：如何用 pandas 读取 csv？',
    image: 'https://picsum.photos/seed/python/400/400'
  },
  torch: {
    name: 'Torch君',
    icon: <Brain size={24} />,
    subtitle: '深度学习炼丹师',
    placeholder: '问问 Torch 君... 例如：解释一下 Transformer 结构',
    image: 'https://picsum.photos/seed/torch/400/400'
  },
  matrix: {
    name: '矩阵妹',
    icon: <Grid3X3 size={24} />,
    subtitle: '向量空间向导',
    placeholder: '问问矩阵妹... 例如：如何求矩阵的逆？',
    image: 'https://picsum.photos/seed/matrix/400/400'
  }
};

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface Conversation {
  id: string;
  title: string;
  agent: string;
  agentKey: string;
  time: string;
  messages: ConversationMessage[];
}

function formatBeijingTime(): string {
  const now = new Date();
  const offset = 8 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bj = new Date(utc + offset * 60000);
  const h = bj.getHours().toString().padStart(2, '0');
  const m = bj.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

type AgentKey = 'math' | 'python' | 'torch' | 'matrix';

const STORAGE_KEY_CONVS = 'tutor_conversations';
const STORAGE_KEY_ACTIVE = 'tutor_active_ids';
const STORAGE_KEY_SAVED = 'tutor_saved_to_wrong';
const STORAGE_KEY_DISMISSED = 'tutor_dismissed_actions';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function Home({ onNavigate, activeAgent = 'math' }: { onNavigate?: (page: any) => void, activeAgent?: AgentKey }) {
  const agent = agents[activeAgent];

  const [allConversations, setAllConversations] = useState<Record<AgentKey, Conversation[]>>(() =>
    loadFromStorage<Record<AgentKey, Conversation[]>>(STORAGE_KEY_CONVS, {
      math: [], python: [], torch: [], matrix: [],
    })
  );
  const [allActiveIds, setAllActiveIds] = useState<Record<AgentKey, string | null>>(() =>
    loadFromStorage<Record<AgentKey, string | null>>(STORAGE_KEY_ACTIVE, {
      math: null, python: null, torch: null, matrix: null,
    })
  );
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedToWrong, setSavedToWrong] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(STORAGE_KEY_SAVED, []))
  );
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(STORAGE_KEY_DISMISSED, []))
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const allConversationsRef = useRef<Record<AgentKey, Conversation[]>>(allConversations);
  allConversationsRef.current = allConversations;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONVS, JSON.stringify(allConversations));
  }, [allConversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(allActiveIds));
  }, [allActiveIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify([...savedToWrong]));
  }, [savedToWrong]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify([...dismissedActions]));
  }, [dismissedActions]);

  const conversations = allConversations[activeAgent];
  const activeConversationId = allActiveIds[activeAgent];
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const setActiveConversationId = (id: string | null) => {
    setAllActiveIds(prev => ({ ...prev, [activeAgent]: id }));
  };

  const setConversations = (updater: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
    setAllConversations(prev => {
      const current = prev[activeAgent];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeAgent]: next };
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, isLoading, activeAgent]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if ((!text && !selectedImage) || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    let convId = activeConversationId || '';
    const isNewConv = !activeConversationId;
    const userMessage: ConversationMessage = {
      role: 'user',
      content: text || '请分析这张图片',
      ...(selectedImage ? { image: selectedImage } : {}),
    };

    if (isNewConv) {
      convId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      const newConv: Conversation = {
        id: convId,
        title: text.length > 20 ? text.slice(0, 20) + '...' : (text || '图片分析'),
        agent: agent.name,
        agentKey: activeAgent,
        time: formatBeijingTime(),
        messages: [userMessage],
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(convId);
    } else {
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, userMessage], time: formatBeijingTime() }
            : c
        )
      );
    }

    const imageToAnalyze = selectedImage;
    setSelectedImage(null);

    try {
      let reply: string;

      if (imageToAnalyze) {
        reply = await analyzeImageWithDeepSeek(imageToAnalyze, text, activeAgent);
      } else {
        await new Promise(r => setTimeout(r, 0));

        const currentConvs = allConversationsRef.current[activeAgent];
        const conv = currentConvs.find(c => c.id === convId);
        const apiMessages: ChatMessage[] = [];

        if (conv) {
          for (const msg of conv.messages) {
            if (!msg.image) {
              apiMessages.push({ role: msg.role, content: msg.content });
            }
          }
        }
        if (!apiMessages.some(m => m.role === 'user' && m.content === text)) {
          apiMessages.push({ role: 'user', content: text });
        }

        reply = await chatWithDeepSeek(apiMessages, activeAgent);
      }

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: reply }], time: formatBeijingTime() }
            : c
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: `请求失败：${errorMsg}` }] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setInputValue('');
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleClearCurrent = () => {
    if (activeConversationId) {
      setConversations(prev => prev.filter(c => c.id !== activeConversationId));
      setActiveConversationId(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full relative">
      <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full soul-gradient flex items-center justify-center text-white shadow-md">
              {agent.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">{agent.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 ${isLoading ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></span>
                <span className="text-xs text-on-surface-variant font-medium">{isLoading ? '思考中...' : '随时为你解答'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 text-primary font-medium text-sm rounded-full bg-white border border-surface-container hover:bg-surface-container transition-colors"
            >
              <MessageCircle size={16} />
              新对话
            </button>
            {activeConversationId && (
              <button
                onClick={handleClearCurrent}
                className="flex items-center gap-2 px-4 py-2 text-on-surface-variant font-medium text-sm rounded-full bg-white border border-surface-container hover:bg-surface-container transition-colors"
              >
                <Trash2 size={16} />
                清空
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
              <div className="mb-8 relative">
                <div className="absolute -inset-8 soul-gradient opacity-20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative z-10 w-44 h-44 flex items-center justify-center bg-white/40 rounded-full backdrop-blur-md shadow-inner">
                  <div className="w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-lg overflow-hidden">
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-extrabold text-on-surface mb-4 text-center">
                你好！我是 {agent.name}
              </h3>
              <p className="text-lg text-on-surface-variant text-center max-w-lg mb-10 leading-relaxed font-medium">
                我是你的{agent.subtitle}。上传作业照片或直接向我提问！
              </p>

              <div className="flex gap-4 mb-12">
                <button
                  onClick={() => setInputValue('帮我解释一下这个概念')}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary-container text-on-secondary-container hover:scale-105 transition-transform duration-300 shadow-sm group"
                >
                  {agent.icon}
                  <span className="font-bold">快速提问</span>
                </button>
                <button
                  onClick={() => onNavigate?.('wrong-questions')}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary-container text-on-primary-container hover:scale-105 transition-transform duration-300 shadow-sm group"
                >
                  <BookOpen className="text-primary group-hover:rotate-12 transition-transform" size={24} />
                  <span className="font-bold">复习错题</span>
                </button>
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg, idx) => {
              const isLastAssistant = msg.role === 'assistant' && idx === activeConversation.messages.length - 1 && !isLoading;
              const pairKey = `${activeConversation.id}-${idx}`;
              const showAction = isLastAssistant && !savedToWrong.has(pairKey) && !dismissedActions.has(pairKey);

              return (
                <div key={idx}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        msg.role === 'user'
                          ? 'soul-gradient text-white rounded-br-md'
                          : 'bg-white border border-surface-container text-on-surface rounded-bl-md'
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="uploaded"
                          className="max-w-full max-h-64 rounded-xl object-contain mb-2"
                        />
                      )}
                      <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-1 [&_pre]:bg-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic">
                        <MessageContent content={msg.content} />
                      </div>
                    </div>
                  </div>
                  {showAction && (
                    <div className="flex justify-start gap-2 mt-2 ml-1">
                      <button
                        onClick={() => {
                          const prevMsg = activeConversation.messages[idx - 1];
                          if (prevMsg?.role === 'user') {
                            saveWrongQuestion({
                              id: Date.now().toString(),
                              question: prevMsg.content,
                              answer: msg.content,
                              agent: agent.name,
                              agentKey: activeAgent,
                              time: formatBeijingTime(),
                            });
                          }
                          setSavedToWrong(prev => new Set(prev).add(pairKey));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Bookmark size={14} />
                        保存到错题本
                      </button>
                      <button
                        onClick={() => setDismissedActions(prev => new Set(prev).add(pairKey))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-low transition-colors"
                      >
                        <X size={14} />
                        忽略
                      </button>
                    </div>
                  )}
                  {savedToWrong.has(pairKey) && isLastAssistant && (
                    <div className="flex justify-start mt-2 ml-1">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-green-50 text-green-600">
                        <Bookmark size={14} />
                        已保存
                      </span>
                    </div>
                  )}
                  {dismissedActions.has(pairKey) && !savedToWrong.has(pairKey) && isLastAssistant && (
                    <div className="flex justify-start mt-2 ml-1">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-surface-container text-on-surface-variant">
                        <X size={14} />
                        已忽略
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-surface-container rounded-2xl rounded-bl-md px-5 py-3">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">思考中...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="w-full pb-8">
          {selectedImage && (
            <div className="mb-3 flex items-center gap-3 px-2">
              <div className="relative group/preview">
                <img
                  src={selectedImage}
                  alt="preview"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-primary/30 shadow-sm"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity shadow-md"
                >
                  <X size={12} />
                </button>
              </div>
              <span className="text-xs text-on-surface-variant">已选择图片，可添加描述后发送</span>
            </div>
          )}
          <div className="relative group">
            <div className="absolute -inset-1 soul-gradient opacity-5 blur-xl group-focus-within:opacity-20 transition-opacity rounded-2xl"></div>
            <div className="relative flex items-center bg-white shadow-xl rounded-2xl border border-surface-container p-2 pr-4 transition-all focus-within:ring-2 ring-primary-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                className="p-3 text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                title="上传图片分析"
              >
                <ImagePlus size={24} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={selectedImage ? '描述你对图片的疑问...' : agent.placeholder}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface py-4 px-2 placeholder:text-on-surface-variant/60 font-medium disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className="w-12 h-12 rounded-full soul-gradient text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-[10px] text-on-surface-variant font-bold tracking-widest uppercase opacity-60">
            <span>多模态 AI</span>
            <span>•</span>
            <span>即时反馈</span>
            <span>•</span>
            <span>逐步讲解</span>
          </div>
        </div>
      </div>

      <aside className="w-80 bg-surface-container-low/80 backdrop-blur-xl border-l border-surface-container p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="text-primary" size={20} />
            <h3 className="font-bold text-lg text-on-surface">历史记录</h3>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">最近</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {conversations.length === 0 ? (
            <div className="text-center text-on-surface-variant text-sm py-8">
              暂无对话记录
            </div>
          ) : (
            conversations.map(conv => (
              <HistoryItem
                key={conv.id}
                title={conv.title}
                time={conv.time}
                agent={conv.agent}
                active={conv.id === activeConversationId}
                onClick={() => setActiveConversationId(conv.id)}
                onDelete={() => handleDeleteConversation(conv.id)}
              />
            ))
          )}
        </div>

        <button className="mt-6 flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold hover:bg-surface-container-high transition-all border border-surface-container">
          <Archive size={14} />
          查看全部历史
        </button>
      </aside>
    </div>
  );
}

function HistoryItem({ title, time, agent, active, onClick, onDelete }: { title: string, time: string, agent: string, active?: boolean, onClick?: () => void, onDelete?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-4 border hover:shadow-md transition-all cursor-pointer ${
        active ? 'border-primary/40 shadow-md' : 'border-transparent hover:border-primary/20'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-bold text-on-surface truncate pr-6">{title}</h4>
        <button
          onClick={e => { e.stopPropagation(); onDelete?.(); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-secondary transition-all absolute top-3 right-3"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-on-surface-variant/70">{time}</span>
        <span className="w-1 h-1 bg-on-surface-variant/30 rounded-full"></span>
        <span className="text-[10px] text-primary font-medium">{agent}</span>
      </div>
    </div>
  );
}
