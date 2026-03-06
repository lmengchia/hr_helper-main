import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Users,
  Gift,
  Trash2,
  Plus,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy
} from 'lucide-react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Participant {
  id: string;
  name: string;
}

// --- Components ---

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'draw' | 'group'>('list');
  const [inputText, setInputText] = useState('');

  // Lucky Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [winnersHistory, setWinnersHistory] = useState<Participant[]>([]);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [drawingPool, setDrawingPool] = useState<Participant[]>([]);

  // Grouping State
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Participant[][]>([]);

  // Duplicate detection
  const duplicateNames = participants
    .map(p => p.name)
    .filter((name, index, self) => self.indexOf(name) !== index);
  const duplicateSet = new Set(duplicateNames);

  const removeDuplicates = () => {
    const seen = new Set();
    const uniqueParticipants = participants.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
    setParticipants(uniqueParticipants);
  };

  const exportGroupsToCSV = () => {
    if (groups.length === 0) return;
    const csvData = groups.flatMap((group, idx) =>
      group.map(p => ({
        '組別': `第 ${idx + 1} 組`,
        '姓名': p.name
      }))
    );
    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Create a safe date string for filenames (YYYY-MM-DD or YYYYMMDD_HHMMSS)
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `分組結果_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize drawing pool when participants change or allowDuplicates changes
  useEffect(() => {
    if (allowDuplicates) {
      setDrawingPool(participants);
    } else {
      // Filter out those who already won if duplicates are not allowed
      const winnerIds = new Set(winnersHistory.map(w => w.id));
      setDrawingPool(participants.filter(p => !winnerIds.has(p.id)));
    }
  }, [participants, allowDuplicates, winnersHistory]);

  const handleAddNames = () => {
    const names = inputText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n !== '');

    const newParticipants = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));

    setParticipants(prev => [...prev, ...newParticipants]);
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map((n: any) => String(n).trim())
          .filter(n => n !== '');

        const newParticipants = names.map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name
        }));
        setParticipants(prev => [...prev, ...newParticipants]);
      },
      header: false
    });
  };

  const clearList = () => {
    if (window.confirm('確定要清空名單嗎？')) {
      setParticipants([]);
      setWinnersHistory([]);
      setGroups([]);
    }
  };

  const startLuckyDraw = () => {
    if (isDrawing || drawingPool.length === 0) return;

    setIsDrawing(true);
    setWinner(null);

    // Animation duration
    const duration = 4000; // Increased to 4s to allow more switches
    const switchInterval = 500; // 0.5 seconds as requested
    const startTime = Date.now();
    let lastSwitchTime = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < duration) {
        if (now - lastSwitchTime >= switchInterval) {
          const randomIndex = Math.floor(Math.random() * drawingPool.length);
          setWinner(drawingPool[randomIndex]);
          lastSwitchTime = now;
        }
        requestAnimationFrame(animate);
      } else {
        const finalIndex = Math.floor(Math.random() * drawingPool.length);
        const selectedWinner = drawingPool[finalIndex];

        setWinner(selectedWinner);
        setWinnersHistory(prev => [selectedWinner, ...prev]);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        });

        setIsDrawing(false);
      }
    };

    animate();
  };

  const handleGrouping = () => {
    if (participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const result: Participant[][] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }

    setGroups(result);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Users size={20} />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">HR 抽籤分組小助手</h1>
          </div>
          <nav className="flex gap-1">
            {[
              { id: 'list', label: '名單管理', icon: Users },
              { id: 'draw', label: '獎品抽籤', icon: Gift },
              { id: 'group', label: '自動分組', icon: Shuffle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:bg-black/5"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* List Management Tab */}
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <Plus size={16} /> 新增名單
                  </h2>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="貼上姓名名單（以換行或逗號分隔）"
                    className="w-full h-40 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none text-sm"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleAddNames}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> 加入名單
                    </button>
                    <label className="flex-1 bg-white border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Upload size={18} /> 上傳 CSV
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Users size={16} /> 目前名單 ({participants.length})
                    </h2>
                    <div className="flex items-center gap-3">
                      {duplicateSet.size > 0 && (
                        <button
                          onClick={removeDuplicates}
                          className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100"
                        >
                          <Trash2 size={12} /> 刪除重複 ({duplicateSet.size})
                        </button>
                      )}
                      {participants.length > 0 && (
                        <button onClick={clearList} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center gap-1">
                          <Trash2 size={14} /> 清空
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {participants.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <Users size={40} strokeWidth={1} className="mb-2 opacity-20" />
                        <p className="text-sm">尚未加入任何成員</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {participants.map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors",
                              duplicateSet.has(p.name)
                                ? "bg-amber-50 border border-amber-200 text-amber-900"
                                : "bg-gray-50 border border-transparent"
                            )}
                          >
                            <span className="truncate flex items-center gap-2">
                              {p.name}
                              {duplicateSet.has(p.name) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="重複項目" />
                              )}
                            </span>
                            <button
                              onClick={() => setParticipants(prev => prev.filter(item => item.id !== p.id))}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lucky Draw Tab */}
          {activeTab === 'draw' && (
            <motion.div
              key="draw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-black/5 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                    <Gift size={14} /> Lucky Draw
                  </div>

                  <div className="h-40 flex items-center justify-center mb-12">
                    <AnimatePresence mode="wait">
                      {winner ? (
                        <motion.div
                          key={winner.id}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-7xl md:text-8xl font-black tracking-tighter text-black"
                        >
                          {winner.name}
                        </motion.div>
                      ) : (
                        <div className="text-gray-300 text-4xl font-light italic">
                          準備好抽獎了嗎？
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <button
                      disabled={isDrawing || drawingPool.length === 0}
                      onClick={startLuckyDraw}
                      className={cn(
                        "w-64 py-5 rounded-2xl text-xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                        isDrawing || drawingPool.length === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-200"
                      )}
                    >
                      {isDrawing ? <Shuffle className="animate-spin" /> : <Gift />}
                      {isDrawing ? "抽獎中..." : "開始抽獎"}
                    </button>

                    <div className="flex items-center gap-8">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                          onClick={() => setAllowDuplicates(!allowDuplicates)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            allowDuplicates ? "bg-emerald-500" : "bg-gray-200"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            allowDuplicates ? "left-6" : "left-1"
                          )} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 group-hover:text-black transition-colors">允許重複中獎</span>
                      </label>
                      <div className="text-sm font-medium text-gray-400">
                        剩餘名額: <span className="text-black">{drawingPool.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Winners History */}
              {winnersHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} /> 中獎紀錄
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {winnersHistory.map((w, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={`${w.id}-${i}`}
                        className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border border-emerald-100"
                      >
                        <span className="opacity-50 text-xs">#{winnersHistory.length - i}</span>
                        {w.name}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Grouping Tab */}
          {activeTab === 'group' && (
            <motion.div
              key="group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight mb-1">自動分組工具</h2>
                    <p className="text-sm text-gray-500">設定每組人數，系統將隨機分配名單。</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                      <span className="text-sm font-medium text-gray-500">每組人數</span>
                      <input
                        type="number"
                        min="1"
                        max={participants.length}
                        value={groupSize}
                        onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent font-bold text-center focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleGrouping}
                      disabled={participants.length === 0}
                      className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                    >
                      <Shuffle size={18} /> 隨機分組
                    </button>
                    {groups.length > 0 && (
                      <button
                        onClick={exportGroupsToCSV}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                        title="下載 CSV"
                      >
                        <Download size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {groups.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Group {idx + 1}</span>
                          <span className="text-xs text-gray-400 font-medium">{group.length} 人</span>
                        </div>
                        <div className="space-y-2">
                          {group.map((p) => (
                            <div key={p.id} className="bg-white px-3 py-2 rounded-lg text-sm font-medium border border-black/5 shadow-sm">
                              {p.name}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                    <Shuffle size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-sm">設定人數並點擊開始分組</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Empty State Overlay */}
      {participants.length === 0 && activeTab !== 'list' && (
        <div className="fixed inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-black/5 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">名單目前是空的</h3>
            <p className="text-gray-500 text-sm mb-8">請先在「名單管理」中加入成員，才能進行抽籤或分組。</p>
            <button
              onClick={() => setActiveTab('list')}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all"
            >
              前往新增名單
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 text-center">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">
          HR Toolbox &copy; 2024 • Crafted for Efficiency
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
