'use client';

import React, { useState } from 'react';
import { Sparkles, X, Key, Wand2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { CandidateSource } from '@/types';

interface GenerateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleGenerated: (newContentId: string) => void;
  approvedSources: CandidateSource[];
}

export function GenerateArticleModal({
  isOpen,
  onClose,
  onArticleGenerated,
  approvedSources,
}: GenerateArticleModalProps) {
  const { activeTenant, user } = useAuth();
  const provider = getDataProvider();

  const [topic, setTopic] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [wordCountTarget, setWordCountTarget] = useState('1400');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    approvedSources.map(s => s.id)
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const generationSteps = [
    'Marka profili kuralları ve yasaklı kelimeler yükleniyor...',
    'Onaylanmış kaynaklardan [S1], [S2] alıntıları ve veriler taranıyor...',
    'SEO başlığı, slug ve meta açıklaması kurgulanıyor...',
    'Yapay zeka makale gövdesini ve atıfları oluşturuyor...',
    'Yazı tamamlandı ve onay kuyruğuna aktarıldı!',
  ];

  const handleStartGeneration = async () => {
    if (!topic.trim() || !activeTenant || !user) return;
    setIsGenerating(true);
    setStepIndex(0);

    // Simulate realistic AI generation progress
    for (let i = 1; i <= 4; i++) {
      await new Promise(r => setTimeout(r, 900));
      setStepIndex(i);
    }

    const activeBrandProfile = await provider.getActiveBrandProfile(activeTenant.id);
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]+/g, '-')
      .replace(/^-|-$/g, '');

    // Add candidate ready item
    const newItem = {
      id: `content-${Date.now()}`,
      tenantId: activeTenant.id,
      title: topic,
      slug: slug || `yazi-${Date.now()}`,
      status: 'ready' as const,
      currentVersionNumber: 1,
      brandProfileVersion: activeBrandProfile?.version || 1,
      authorName: user.fullName || 'Yapay Zeka & Editör',
      category: 'Blog',
      seoTitle: `${topic} | ${activeTenant.name}`,
      metaDescription: `${topic} konusunda güncel yaklaşımlar, sektör verileri ve pratik uygulama rehberi.`,
      focusKeyword: focusKeyword || topic.slice(0, 25),
      sourceIds: selectedSourceIds,
      wordCount: parseInt(wordCountTarget) || 1400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update demo provider state
    const currentItems = await provider.listContentItems(activeTenant.id);
    currentItems.unshift(newItem);

    // Audit log
    await provider.createAuditLog({
      tenantId: activeTenant.id,
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'AI_CONTENT_GENERATED',
      entityType: 'content_item',
      entityId: newItem.id,
      details: { topic, targetWordCount: wordCountTarget },
    });

    await new Promise(r => setTimeout(r, 600));
    setIsGenerating(false);
    onArticleGenerated(newItem.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[#0D9488] mb-1">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Yapay Zeka Motoru</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Yeni Blog Yazısı Üret</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeTenant?.name} şirketinin aktif marka profili ve kaynaklarına tam uyumlu yazı üretin.
        </p>

        {isGenerating ? (
          <div className="py-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Wand2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">
                {generationSteps[stepIndex]}
              </h4>
              <p className="text-xs text-slate-400">
                Lütfen bekleyin, şirket kuralları denetlenerek taslak derleniyor.
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0D9488] h-full transition-all duration-500 rounded-full"
                style={{ width: `${((stepIndex + 1) / generationSteps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleStartGeneration();
            }}
            className="space-y-4 mt-5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yazı Başlığı / Odak Konu
              </label>
              <input
                type="text"
                required
                placeholder="Örn: 2026 Yılında Güneş Santrallerinde Verimlilik Artışı"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Odak Anahtar Kelime
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="güneş enerjisi verimliliği"
                    value={focusKeyword}
                    onChange={e => setFocusKeyword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Uzunluk
                </label>
                <select
                  value={wordCountTarget}
                  onChange={e => setWordCountTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="900">Kısa (800 - 1000 kelime)</option>
                  <option value="1400">Standart (1200 - 1500 kelime)</option>
                  <option value="2200">Kapsamlı (2000 - 2500 kelime)</option>
                </select>
              </div>
            </div>

            {/* Source Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Metne Dahil Edilecek Onaylı Kaynaklar</span>
                <span className="text-[11px] text-[#0D9488] font-normal">
                  {selectedSourceIds.length} kaynak seçildi
                </span>
              </label>

              <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                {approvedSources.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-1 text-center">
                    Henüz onaylı kaynak bulunmuyor. Kaynak Taramasından ekleyebilirsiniz.
                  </p>
                ) : (
                  approvedSources.map(s => {
                    const isChecked = selectedSourceIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedSourceIds(prev => prev.filter(id => id !== s.id));
                            } else {
                              setSelectedSourceIds(prev => [...prev, s.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-[#0D9488] rounded-sm focus:ring-[#0D9488] border-slate-300"
                        />
                        <span className="truncate font-medium text-slate-700">
                          <span className="text-[#0D9488]">[{s.citationKey}]</span> {s.title}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!topic.trim()}
                className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yapay Zeka ile Üret</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
