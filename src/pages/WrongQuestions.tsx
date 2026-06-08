import React, { useState, useEffect, useRef, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Book, Filter, FileText, Trash2, ArrowRight, BarChart2, Download, Loader2 } from 'lucide-react';
import { getWrongQuestions, deleteWrongQuestion, WrongQuestion } from '@/src/services/wrongQuestions';
import MessageContent from '@/src/components/MessageContent';

const agentLabels: Record<string, string> = {
  math: '高数',
  python: 'Python',
  torch: '深度学习',
  matrix: '线代',
};

export default function WrongQuestions() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuestions(getWrongQuestions());
  }, []);

  const filtered = filter === 'all' ? questions : questions.filter(q => q.agentKey === filter);

  const handleDelete = (id: string) => {
    deleteWrongQuestion(id);
    setQuestions(getWrongQuestions());
    if (expandedId === id) setExpandedId(null);
  };

  const handleExportPDF = async () => {
    if (filtered.length === 0 || exporting) return;
    setExporting(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const container = document.createElement('div');
      container.style.padding = '20px 24px';
      container.style.fontFamily = '"SimSun", "STSong", serif';
      container.style.color = '#333';
      container.style.background = '#fff';
      container.style.width = '190mm';

      const headerDiv = document.createElement('div');
      headerDiv.style.marginBottom = '16px';
      headerDiv.style.borderBottom = '2px solid #6e3bd8';
      headerDiv.style.paddingBottom = '10px';

      const title = document.createElement('h1');
      title.textContent = '智课通 AI Tutor — 我的错题本';
      title.style.fontSize = '20px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '4px';
      title.style.color = '#6e3bd8';
      headerDiv.appendChild(title);

      const subtitle = document.createElement('p');
      subtitle.textContent = `导出时间：${new Date().toLocaleString('zh-CN')} | 共 ${filtered.length} 道错题`;
      subtitle.style.fontSize = '11px';
      subtitle.style.color = '#999';
      headerDiv.appendChild(subtitle);

      container.appendChild(headerDiv);

      for (let i = 0; i < filtered.length; i++) {
        const q = filtered[i];

        const item = document.createElement('div');
        item.style.marginBottom = '24px';
        item.style.padding = '14px 16px';
        item.style.background = '#fafafa';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid #eee';
        item.style.breakInside = 'avoid';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';

        const idx = document.createElement('span');
        idx.textContent = `第 ${i + 1} 题`;
        idx.style.fontSize = '13px';
        idx.style.fontWeight = 'bold';
        idx.style.color = '#6e3bd8';
        header.appendChild(idx);

        const meta = document.createElement('span');
        meta.textContent = `${agentLabels[q.agentKey] || q.agent} | ${q.time}`;
        meta.style.fontSize = '10px';
        meta.style.color = '#999';
        header.appendChild(meta);

        item.appendChild(header);

        const qLabel = document.createElement('div');
        qLabel.textContent = '【题目】';
        qLabel.style.fontSize = '11px';
        qLabel.style.fontWeight = 'bold';
        qLabel.style.color = '#666';
        qLabel.style.marginBottom = '4px';
        item.appendChild(qLabel);

        const qContent = document.createElement('div');
        qContent.style.fontSize = '13px';
        qContent.style.lineHeight = '1.8';
        qContent.style.marginBottom = '14px';
        qContent.style.overflowWrap = 'break-word';
        qContent.style.wordBreak = 'break-word';
        item.appendChild(qContent);

        const aLabel = document.createElement('div');
        aLabel.textContent = '【AI 解答】';
        aLabel.style.fontSize = '11px';
        aLabel.style.fontWeight = 'bold';
        aLabel.style.color = '#666';
        aLabel.style.marginBottom = '4px';
        item.appendChild(aLabel);

        const aContent = document.createElement('div');
        aContent.style.fontSize = '12px';
        aContent.style.lineHeight = '1.8';
        aContent.style.overflowWrap = 'break-word';
        aContent.style.wordBreak = 'break-word';
        item.appendChild(aContent);

        container.appendChild(item);

        const qRoot = createRoot(qContent);
        qRoot.render(React.createElement(MessageContent, { content: q.question }));

        const aRoot = createRoot(aContent);
        aRoot.render(React.createElement(MessageContent, { content: q.answer }));
      }

      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 500));

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `错题本_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const subjectCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.agentKey] = (acc[q.agentKey] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full">
      <main className="flex-1 px-10 py-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-secondary">
                <Book size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">我的错题本</h1>
            </div>
            <p className="text-xs text-on-surface-variant ml-1">当前收录 <span className="text-primary font-bold">{questions.length}</span> 道错题</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-surface-container rounded-full px-4 py-1.5 gap-2 text-xs text-on-surface-variant">
              <Filter size={14} />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs p-0 pr-4 cursor-pointer"
              >
                <option value="all">全部学科</option>
                <option value="math">高数</option>
                <option value="python">Python</option>
                <option value="torch">深度学习</option>
                <option value="matrix">线代</option>
              </select>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={filtered.length === 0 || exporting}
              className="bg-secondary text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-secondary/20 flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {exporting ? '导出中...' : '导出PDF'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <Book size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">暂无错题记录</p>
            <p className="text-xs mt-1 opacity-60">在对话中点击"保存到错题本"即可添加</p>
          </div>
        ) : (
          <div className="relative space-y-8 pl-6 border-l-2 border-secondary-container/30">
            {filtered.map(q => (
              <div key={q.id} className="relative">
                <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white bg-primary shadow-sm"></div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-[11px] font-bold text-on-surface-variant/60">{q.time}</span>
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {agentLabels[q.agentKey] || q.agent}
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-container hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="text-sm font-bold text-on-surface-variant">题目</div>
                      <div className="text-sm text-on-surface leading-relaxed">
                        <MessageContent content={q.question} />
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors" onClick={() => handleDelete(q.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {expandedId === q.id ? (
                    <div className="bg-surface-container-low rounded-xl p-4 mb-4">
                      <div className="text-[9px] bg-primary-container text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mb-2">AI 解答</div>
                      <div className="text-xs text-on-surface-variant leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-gray-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-xs">
                        <MessageContent content={q.answer} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-low rounded-xl p-4 mb-4">
                      <div className="text-[9px] bg-primary-container text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mb-2">AI 解答</div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{q.answer.replace(/[#*`\[\]$\\]/g, '').slice(0, 100)}...</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                    <button
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      {expandedId === q.id ? '收起详情' : '查看详情'} <ArrowRight size={14} className={expandedId === q.id ? 'rotate-90' : ''} />
                    </button>
                    <span className="text-[10px] text-on-surface-variant/60">{q.agent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className="hidden xl:block w-80 p-8 space-y-8 sticky top-0 h-fit">
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container">
          <h4 className="font-bold text-sm text-on-surface mb-6 flex items-center gap-2">
            <BarChart2 className="text-primary" size={20} />
            学科分布
          </h4>
          <div className="space-y-5">
            {Object.entries(subjectCounts).map(([key, count]) => (
              <StatBar
                key={key}
                label={agentLabels[key] || key}
                count={count}
                total={questions.length}
              />
            ))}
            {Object.keys(subjectCounts).length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-4">暂无数据</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatBar({ label, count, total }: { label: string, count: number, total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{count} 题 ({percent}%)</span>
      </div>
      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
