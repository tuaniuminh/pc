import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Play, 
  Layers,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Activity,
  Edit3,
  Sliders,
  Save
} from 'lucide-react';
import { generateKegelPlan, extractJsonFromText } from '../services/geminiService';
import { 
  getCustomPlans, 
  saveCustomPlan, 
  deleteCustomPlan, 
  getHistoryStats,
  getUserProfile
} from '../services/storageService';

const PlanManager = ({ apiKey, onSelectPlan, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  
  // State Cho Thiết Kế Thủ Công
  const [manualPlanName, setManualPlanName] = useState('Bài Tập Cá Nhân Hóa');
  const [manualGoal, setManualGoal] = useState('Tự thiết kế');
  const [manualStages, setManualStages] = useState([
    { label: 'Khởi động nhanh', type: 'squeezing', squeeze: 2, relax: 2, reps: 10 },
    { label: 'Siết bền giữ sâu', type: 'squeezing', squeeze: 5, relax: 5, reps: 5 },
    { label: 'Kegel ngược thả lỏng', type: 'reverse', squeeze: 3, relax: 3, reps: 5 }
  ]);

  // State Cho AI Generator
  const [customGoals, setCustomGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [savedPlans, setSavedPlans] = useState(getCustomPlans());
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const stats = getHistoryStats();
  const profile = getUserProfile();

  // Thêm chặng mới cho bài tập thủ công
  const handleAddStage = () => {
    setManualStages([
      ...manualStages,
      { label: `Chặng ${manualStages.length + 1}`, type: 'squeezing', squeeze: 3, relax: 3, reps: 5 }
    ]);
  };

  // Cập nhật chặng thủ công
  const handleUpdateStage = (index, field, value) => {
    const next = [...manualStages];
    next[index][field] = value;
    setManualStages(next);
  };

  // Xóa chặng thủ công
  const handleDeleteStage = (index) => {
    if (manualStages.length <= 1) return;
    setManualStages(manualStages.filter((_, i) => i !== index));
  };

  // Lưu bài tập thủ công và kích hoạt ngay
  const handleSaveManualPlan = () => {
    if (!manualPlanName.trim()) return;
    const newPlan = {
      id: 'manual_' + Date.now(),
      planName: manualPlanName,
      goal: manualGoal,
      createdAt: new Date().toISOString(),
      stages: manualStages
    };
    const updated = saveCustomPlan(newPlan);
    setSavedPlans(updated);
    if (onSelectPlan) {
      onSelectPlan(newPlan);
    }
  };

  const handleGenerateAI = async () => {
    if (!apiKey || !apiKey.trim()) {
      setErrorMsg("Vui lòng cấu hình Google Gemini API Key trong phần Cài đặt trước khi tiếp tục.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedPlan(null);

    try {
      const plan = await generateKegelPlan(apiKey, profile, stats, customGoals);
      setGeneratedPlan(plan);
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi tạo giáo án từ Gemini AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndActivate = (plan) => {
    const updated = saveCustomPlan(plan);
    setSavedPlans(updated);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const handleDeletePlan = (id) => {
    const updated = deleteCustomPlan(id);
    setSavedPlans(updated);
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    try {
      const parsed = extractJsonFromText(pastedText);
      const newPlan = {
        ...parsed,
        id: 'pasted_' + Date.now(),
        createdAt: new Date().toISOString()
      };
      setGeneratedPlan(newPlan);
      setShowManualPaste(false);
      setPastedText('');
    } catch (e) {
      setErrorMsg("Không thể nhận diện cấu trúc JSON hợp lệ từ nội dung dán vào.");
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
          <Edit3 className="text-cyan-500" />
          <span>Thiết Kế Bài Tập Riêng</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
          Tự thiết lập số giây siết/thả hoặc để Bác sĩ AI tối ưu hóa giáo án theo thể trạng
        </p>
      </div>

      {/* Tab chuyển đổi: Tự Thiết Kế <-> Bác Sĩ AI */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400'
          }`}
        >
          <Sliders size={14} />
          <span>Tự Thiết Kế Thủ Công</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400'
          }`}
        >
          <Sparkles size={14} />
          <span>Trợ Lý Bác Sĩ AI</span>
        </button>
      </div>

      {/* ================= TAB 1: TỰ THIẾT KẾ BÀI TẬP THỦ CÔNG ================= */}
      {activeTab === 'manual' && (
        <div className="space-y-4 animate-fade-in">
          {/* Tên bài tập & Mục tiêu */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-white/10 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white">Tên Bài Tập Của Bạn:</label>
              <input
                type="text"
                value={manualPlanName}
                onChange={(e) => setManualPlanName(e.target.value)}
                placeholder="VD: Bài tập buổi sáng chuyên sâu"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white">Mục Tiêu / Ghi Chú:</label>
              <input
                type="text"
                value={manualGoal}
                onChange={(e) => setManualGoal(e.target.value)}
                placeholder="VD: Tăng sức bền và kiểm soát"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Danh Sách Các Chặng Tập */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Layers size={14} className="text-cyan-500" />
                <span>Các Chặng Tập Trong Bài ({manualStages.length})</span>
              </h3>
              <button
                onClick={handleAddStage}
                className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center space-x-1 active:scale-95"
              >
                <Plus size={14} />
                <span>Thêm Chặng</span>
              </button>
            </div>

            <div className="space-y-3">
              {manualStages.map((stage, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-black flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={stage.label}
                        onChange={(e) => handleUpdateStage(idx, 'label', e.target.value)}
                        className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <select
                        value={stage.type}
                        onChange={(e) => handleUpdateStage(idx, 'type', e.target.value)}
                        className="bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-900 dark:text-white"
                      >
                        <option value="squeezing">⚡ Siết Kegel</option>
                        <option value="reverse">🌊 Kegel Ngược</option>
                        <option value="transition">⏳ Nghỉ Chuyển</option>
                      </select>
                      {manualStages.length > 1 && (
                        <button
                          onClick={() => handleDeleteStage(idx)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tùy chỉnh Giây Siết - Giây Thả - Số Hiệp */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">Giây Siết</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleUpdateStage(idx, 'squeeze', Math.max(1, stage.squeeze - 1))}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >-</button>
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{stage.squeeze}s</span>
                        <button
                          onClick={() => handleUpdateStage(idx, 'squeeze', stage.squeeze + 1)}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >+</button>
                      </div>
                    </div>

                    <div className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">Giây Thả</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleUpdateStage(idx, 'relax', Math.max(1, stage.relax - 1))}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >-</button>
                        <span className="font-black text-sm text-cyan-600 dark:text-cyan-400">{stage.relax}s</span>
                        <button
                          onClick={() => handleUpdateStage(idx, 'relax', stage.relax + 1)}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >+</button>
                      </div>
                    </div>

                    <div className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">Số Hiệp</div>
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <button
                          onClick={() => handleUpdateStage(idx, 'reps', Math.max(1, stage.reps - 1))}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >-</button>
                        <span className="font-black text-sm text-purple-600 dark:text-purple-400">{stage.reps}</span>
                        <button
                          onClick={() => handleUpdateStage(idx, 'reps', stage.reps + 1)}
                          className="w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Lưu & Kích Hoạt */}
            <button
              onClick={handleSaveManualPlan}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>LƯU & BẮT ĐẦU TẬP NGAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TRỢ LÝ BÁC SĨ AI (GEMINI) ================= */}
      {activeTab === 'ai' && (
        <div className="space-y-4 animate-fade-in">
          {/* THẺ TỔNG QUAN DỮ LIỆU ĐẦU VÀO GỬI CHO AI */}
          <div className="glass-panel p-4 rounded-3xl border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="flex items-center space-x-1.5">
                <Activity size={14} className="text-cyan-500" />
                <span>Dữ Liệu Hồ Sơ Lâm Sàng Gửi Gemini</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-neon border border-cyan-500/20">
                {profile.gender === 'female' ? 'Nữ' : 'Nam'} • {new Date().getFullYear() - (profile.birthYear || 1995)} tuổi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] text-slate-400">Tổng Buổi</div>
                <div className="font-black text-slate-900 dark:text-white">{stats.totalWorkouts}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] text-slate-400">Lượt Siết</div>
                <div className="font-black text-emerald-600 dark:text-neon">{stats.totalSqueezes}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] text-slate-400">Kegel Ngược</div>
                <div className="font-black text-cyan-600 dark:text-cyan-neon">{stats.totalReverseKegels}</div>
              </div>
            </div>

            {/* Ô Nhập Mục Tiêu Riêng */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                Mục tiêu hoặc triệu chứng cần cải thiện:
              </label>
              <input
                type="text"
                value={customGoals}
                onChange={(e) => setCustomGoals(e.target.value)}
                placeholder="Vd: Chống xuất tinh sớm, tăng thời gian siết..."
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>{isGenerating ? "Gemini Đang Phân Tích..." : "Tạo Giáo Án Cá Nhân Hóa Với Gemini AI"}</span>
            </button>
          </div>

          {/* KẾT QUẢ GIÁO ÁN DO AI THIẾT KẾ */}
          {generatedPlan && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-500/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-neon flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-neon border border-emerald-500/20">
                      GIÁO ÁN MỚI
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {generatedPlan.planName}
                    </h3>
                  </div>
                </div>
              </div>

              {generatedPlan.evaluation && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5">
                  <div className="text-xs font-black text-cyan-600 dark:text-cyan-neon">🩺 Đánh Giá Lâm Sàng:</div>
                  <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                    {generatedPlan.evaluation}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleSaveAndActivate(generatedPlan)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-neon flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Play size={16} fill="currentColor" />
                <span>KÍCH HOẠT & BẮT ĐẦU TẬP NGAY</span>
              </button>
            </div>
          )}

          {/* TÙY CHỌN DÁN THỦ CÔNG */}
          <div className="pt-1">
            <button
              onClick={() => setShowManualPaste(!showManualPaste)}
              className="text-xs text-cyan-600 dark:text-cyan-neon font-bold flex items-center space-x-1"
            >
              <span>{showManualPaste ? "▼ Đóng ô dán thủ công" : "▶ Hoặc Dán Kết Quả Từ Gemini Pro Web"}</span>
            </button>

            {showManualPaste && (
              <div className="mt-3 p-4 rounded-2xl glass-panel border border-slate-300 dark:border-white/10 space-y-2 animate-fade-in">
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Dán nội dung JSON từ Gemini Pro tại đây..."
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                />
                <button
                  onClick={handleParsePastedText}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-white font-bold text-xs active:scale-95 shadow-sm"
                >
                  Phân Tích & Nạp Giáo Án
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DANH SÁCH GIÁO ÁN TÙY CHỈNH ĐÃ LƯU ================= */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <Layers size={16} className="text-cyan-500" />
          <span>Giáo Án Tùy Chỉnh Đã Lưu ({savedPlans.length})</span>
        </h3>

        {savedPlans.length > 0 ? (
          <div className="space-y-2">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {plan.planName}
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                    {plan.stages?.length || 0} chặng tập • {plan.goal || 'Tùy chỉnh'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-95"
                    title="Xóa giáo án"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => onSelectPlan && onSelectPlan(plan)}
                    className="py-1.5 px-3 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1 active:scale-95 shadow-sm"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Tập</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center text-xs text-slate-400">
            Chưa có giáo án riêng nào được lưu. Hãy tự thiết kế hoặc tạo bằng AI ở trên!
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanManager;
