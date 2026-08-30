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
  Activity
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
  const [customGoals, setCustomGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [savedPlans, setSavedPlans] = useState(getCustomPlans());
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const stats = getHistoryStats();
  const profile = getUserProfile();

  const handleGenerate = async () => {
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
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
          <Sparkles className="text-cyan-500" />
          <span>Trợ Lý Bác Sĩ Sàn Chậu AI</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
          Phân tích lịch sử tập luyện và thiết kế giáo án Kegel cá nhân hóa từ Google Gemini
        </p>
      </div>

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
            placeholder="Vd: Chống xuất tinh sớm, tăng thời gian siết, phục hồi sau sinh..."
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-400"
          />
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div>{errorMsg}</div>
              {!apiKey && (
                <button
                  onClick={onOpenSettings}
                  className="mt-1 font-bold underline block"
                >
                  Mở Cài Đặt để nhập API Key →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nút Tạo Giáo Án */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          <span>{isGenerating ? "Gemini Đang Phân Tích..." : "Tạo Giáo Án Cá Nhân Hóa Với Gemini"}</span>
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

          {/* Nhận xét & Lời khuyên của Bác sĩ AI */}
          {generatedPlan.evaluation && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5">
              <div className="text-xs font-black text-cyan-600 dark:text-cyan-neon">🩺 Đánh Giá Lâm Sàng:</div>
              <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                {generatedPlan.evaluation}
              </p>
              {generatedPlan.advice && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">💡 Lời Khuyên Chiến Lược:</div>
                  <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed mt-0.5">
                    {generatedPlan.advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Danh Sách Các Chặng Tập */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">Cấu Trúc Các Chặng Tập:</div>
            {generatedPlan.stages?.map((st, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 font-black flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{st.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400">
                      {st.type === 'reverse' ? `🌊 Kegel ngược ${st.squeeze}s • thả ${st.relax}s` : st.type === 'transition' ? `⏳ Nghỉ ${st.relax}s` : `⚡ Siết ${st.squeeze}s • thả ${st.relax}s`}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-neon">
                  {st.type === 'transition' ? '1 lần' : `${st.reps} hiệp`}
                </span>
              </div>
            ))}
          </div>

          {/* Nút Kích Hoạt & Tập Ngay */}
          <button
            onClick={() => handleSaveAndActivate(generatedPlan)}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-neon flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>KÍCH HOẠT & BẮT ĐẦU TẬP NGAY</span>
          </button>
        </div>
      )}

      {/* DANH SÁCH GIÁO ÁN TÙY CHỈNH ĐÃ LƯU */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <Layers size={16} className="text-cyan-500" />
          <span>Giáo Án Tùy Chỉnh Của Bạn ({savedPlans.length})</span>
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
            Chưa có giáo án AI nào được lưu. Hãy bấm nút tạo giáo án phía trên!
          </div>
        )}
      </div>

      {/* TÙY CHỌN DÁN THỦ CÔNG TỪ WEB GEMINI PRO */}
      <div className="pt-2">
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
  );
};

export default PlanManager;
