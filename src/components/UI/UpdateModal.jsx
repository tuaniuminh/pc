import React from 'react';
import { 
  Rocket, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { installViaTrollStore, openDirectDownload } from '../../services/updateService';

const UpdateModal = ({ updateInfo, onClose }) => {
  if (!updateInfo || !updateInfo.hasUpdate) return null;

  const handleInstallTrollStore = () => {
    installViaTrollStore(updateInfo.ipaDownloadUrl);
  };

  const handleDirectDownload = () => {
    openDirectDownload(updateInfo.ipaDownloadUrl);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl shadow-cyan-500/10 space-y-4 relative text-white">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all active:scale-95"
          title="Để sau"
        >
          <X size={16} />
        </button>

        {/* Header Icon Tên Lửa */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Rocket size={24} className="animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                BẢN MỚI
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {updateInfo.publishedAt}
              </span>
            </div>
            <h3 className="text-base font-black tracking-tight text-white mt-0.5">
              {updateInfo.releaseName || `PC Flex ${updateInfo.tagName}`}
            </h3>
          </div>
        </div>

        {/* So sánh phiên bản */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="text-gray-400">
            Đang dùng: <span className="text-amber-400 font-bold">{updateInfo.currentVersion}</span>
          </div>
          <ArrowRight size={14} className="text-cyan-400" />
          <div className="text-gray-400">
            Bản mới: <span className="text-emerald-400 font-bold">{updateInfo.tagName}</span>
          </div>
        </div>

        {/* Nhật ký thay đổi (Changelog Box) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-gray-300 flex items-center space-x-1">
            <Sparkles size={12} className="text-cyan-400" />
            <span>Nội dung cập nhật:</span>
          </div>
          <div className="max-h-36 overflow-y-auto p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-gray-300 leading-relaxed space-y-1 select-text">
            {updateInfo.body.split('\n').map((line, idx) => (
              <div key={idx} className="break-words">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Cụm Nút Hành Động */}
        <div className="space-y-2 pt-1">
          {/* Nút 1: Cài đặt 1 chạm qua TrollStore */}
          <button
            onClick={handleInstallTrollStore}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Zap size={16} fill="currentColor" />
            <span>⚡ Cập Nhật 1 Chạm Qua TrollStore</span>
          </button>

          {/* Nút 2: Tải IPA hoặc Để Sau */}
          <div className="flex gap-2">
            <button
              onClick={handleDirectDownload}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Download size={13} />
              <span>Tải File IPA</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold text-[11px] active:scale-95 transition-all"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;
