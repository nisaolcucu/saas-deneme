'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  History,
  FileCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { BrandProfile } from '@/types';
import { parseBrandProfileMarkdown } from '@/lib/brand-profile/parser';
import { BRAND_PROFILE_TEMPLATE_MD } from '@/lib/brand-profile/template';

export function BrandProfileView() {
  const { activeTenant, user } = useAuth();
  const provider = getDataProvider();

  const [activeProfile, setActiveProfile] = useState<BrandProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<BrandProfile[]>([]);
  const [markdownInput, setMarkdownInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ReturnType<typeof parseBrandProfileMarkdown>['data'] | null>(null);
  const [createdDraft, setCreatedDraft] = useState<BrandProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!activeTenant) return;
    const active = await provider.getActiveBrandProfile(activeTenant.id);
    setActiveProfile(active);

    const list = await provider.listBrandProfiles(activeTenant.id);
    setAllProfiles(list);

    if (active && !markdownInput) {
      setMarkdownInput(active.markdownRaw);
    }
  }, [activeTenant, provider, markdownInput]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleDownloadTemplate = () => {
    const blob = new Blob([BRAND_PROFILE_TEMPLATE_MD], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marka-profili-sablonu.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      setParseError('Dosya boyutu 512 KB sınırını aşıyor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setMarkdownInput(text);
      validateAndPreview(text);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (text: string) => {
    setParseError(null);
    const result = parseBrandProfileMarkdown(text);
    if (!result.success) {
      setParseError(result.error || 'Ayrıştırma hatası.');
      setPreviewData(null);
      return null;
    }
    setPreviewData(result.data || null);
    return result.data;
  };

  const handleSaveDraft = async () => {
    if (!activeTenant) return;
    const parsed = validateAndPreview(markdownInput);
    if (!parsed) return;

    try {
      const draft = await provider.saveBrandProfileDraft(activeTenant.id, {
        name: parsed.name,
        targetAudience: parsed.targetAudience,
        tone: parsed.tone,
        bannedWords: parsed.bannedWords,
        preferredKeywords: parsed.preferredKeywords,
        markdownRaw: parsed.markdownRaw,
      });

      setCreatedDraft(draft);
      setNotification(`Taslak v${draft.version} oluşturuldu. Yayına almak için 'Onayla ve Etkinleştir' butonuna basın.`);
      await loadProfiles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Taslak kaydedilemedi.');
    }
  };

  const handleActivateDraft = async (profileId: string) => {
    if (!activeTenant || !user) return;
    try {
      await provider.activateBrandProfile(activeTenant.id, profileId, user.id);
      setCreatedDraft(null);
      setNotification('Marka profili başarıyla etkinleştirildi! Yeni blog üretimleri bu sürümü kullanacak.');
      setTimeout(() => setNotification(null), 5000);
      await loadProfiles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Etkinleştirme başarısız.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marka Profili</h1>
          <p className="text-sm text-slate-500 mt-1">
            Yapay zekanın yazacağı içeriklerin dilini, tonunu ve kurallarını belirleyen kurumsal rehber.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 rounded-lg shadow-2xs flex items-center gap-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Şablonu İndir (.md)</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Profile Status Card */}
      {activeProfile && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">
                Aktif Marka Profili: {activeProfile.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                v{activeProfile.version} (Yayında)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Son güncelleme: {new Date(activeProfile.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Hedef Kitle
              </span>
              <p className="text-slate-800 font-medium">{activeProfile.targetAudience}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Ton & Üslup
              </span>
              <p className="text-slate-800 font-medium">{activeProfile.tone}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Yasaklı Kelimeler
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeProfile.bannedWords.length === 0 ? (
                  <span className="text-slate-400">Tanımlı değil</span>
                ) : (
                  activeProfile.bannedWords.map((w, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium text-[10px]">
                      {w}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor & Parser Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Markdown Düzenleyici veya Dosya Yükle</h3>
            </div>

            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>.md Dosyası Seç</span>
              <input type="file" accept=".md,.markdown,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            value={markdownInput}
            onChange={e => {
              setMarkdownInput(e.target.value);
              validateAndPreview(e.target.value);
            }}
            rows={14}
            placeholder="# Marka Rehberinizi Buraya Yapıştırın..."
            className="w-full text-xs font-mono p-4 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] leading-relaxed"
          />

          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              XSS ve script koruması devrede • Max 512 KB
            </span>

            <button
              onClick={handleSaveDraft}
              disabled={!markdownInput.trim()}
              className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Taslak Olarak Ayrıştır ve Kaydet
            </button>
          </div>
        </div>

        {/* Right: Parsed Preview & Version Control (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Parser Result Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-bold text-slate-900">Ayrıştırıcı Önizlemesi</h3>
            </div>

            {previewData ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Marka Adı:</span>
                  <p className="font-bold text-slate-800">{previewData.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Hedef Kitle:</span>
                  <p className="text-slate-700">{previewData.targetAudience}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Ton:</span>
                  <p className="text-slate-700">{previewData.tone}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Yasaklı Kelimeler:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.bannedWords.map((w, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Sol tarafa markdown metin girildiğinde yapısal önizleme burada görünecektir.
              </p>
            )}

            {createdDraft && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  Taslak Hazır (v{createdDraft.version})
                </p>
                <p className="text-[11px] text-amber-700">
                  Bu profil şu anda taslak durumundadır. Aktif içerik üretimlerinde kullanılabilmesi için onayınız gerekir.
                </p>
                <button
                  onClick={() => handleActivateDraft(createdDraft.id)}
                  className="w-full py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded transition-colors"
                >
                  Taslağı Onayla ve v{createdDraft.version} Olarak Yayınla
                </button>
              </div>
            )}
          </div>

          {/* Sürüm Geçmişi */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Sürüm Geçmişi</h3>
            </div>

            <div className="space-y-2">
              {allProfiles.map(p => (
                <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">v{p.version}</span>
                    <span className="ml-2 text-slate-500 truncate max-w-[150px] inline-block align-bottom">{p.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {p.status === 'active' ? 'Aktif' : p.status === 'draft' ? 'Taslak' : 'Arşiv'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
