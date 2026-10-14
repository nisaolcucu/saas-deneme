'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Sparkles,
  MessageSquarePlus,
  Send,
  Eye,
  X,
  Maximize2,
  ShieldCheck,
  ChevronRight,
  Target,
  Lightbulb,
  Layers,
  FileCode,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { ReviewItem } from '@/types';

export function ReviewQueueView() {
  const { activeTenant, user } = useAuth();
  const provider = getDataProvider();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'source' | 'outline' | 'final'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Pop-up Detail Modal State
  const [detailItem, setDetailItem] = useState<ReviewItem | null>(null);
  const [outlineViewMode, setOutlineViewMode] = useState<'cards' | 'markdown'>('cards');

  // Revision Modal State
  const [revisionItem, setRevisionItem] = useState<ReviewItem | null>(null);
  const [revisionTargetSectionId, setRevisionTargetSectionId] = useState<string>('all');
  const [revisionNote, setRevisionNote] = useState('');

  const loadReviews = useCallback(async () => {
    if (!activeTenant) return;
    const items = await provider.listReviewItems(activeTenant.id);
    setReviews(items);
  }, [activeTenant, provider]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDecision = async (item: ReviewItem, decision: 'approved' | 'rejected') => {
    if (!activeTenant || !user) return;
    setProcessingId(item.id);
    try {
      await provider.submitReviewDecision(activeTenant.id, item.id, decision, user.id);
      setMessage(
        decision === 'approved' 
          ? `"${item.targetTitle}" onaylandı ve süreç bir sonraki adıma aktarıldı.` 
          : `"${item.targetTitle}" reddedildi.`
      );
      setTimeout(() => setMessage(null), 3500);
      setDetailItem(null); // close detail modal if open
      await loadReviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenSectionRevision = (item: ReviewItem, sectionId: string) => {
    setRevisionItem(item);
    setRevisionTargetSectionId(sectionId);
    setRevisionNote('');
    setDetailItem(null);
  };

  const handleSendRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionItem || !activeTenant || !user || !revisionNote.trim()) return;

    setProcessingId(revisionItem.id);
    try {
      const noteText = revisionNote.trim();
      let targetDesc = 'Genel Plan';

      if (revisionItem.type === 'outline') {
        if (revisionItem.metadata.outlineSections && revisionTargetSectionId !== 'all') {
          const sec = revisionItem.metadata.outlineSections.find(s => s.id === revisionTargetSectionId);
          if (sec) {
            targetDesc = sec.heading;
            sec.scopeDescription = `[⚡ Revize Edildi: ${noteText}] ${sec.scopeDescription}`;
            sec.keyArguments.unshift(`⚡ Revizyon Talimatı: ${noteText}`);
          }
        } else {
          revisionItem.metadata.outlinePoints = [
            ...(revisionItem.metadata.outlinePoints || []),
            `⚡ Editör Revizyonu: ${noteText}`,
          ];
        }
      } else if (revisionItem.type === 'final') {
        revisionItem.metadata.draftPreview = `[Revize Edildi: "${noteText}"] ${revisionItem.metadata.draftPreview}`;
      }

      await provider.createAuditLog({
        tenantId: activeTenant.id,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'REVISION_REQUESTED',
        entityType: 'review_item',
        entityId: revisionItem.id,
        details: { note: noteText, targetSection: targetDesc, targetTitle: revisionItem.targetTitle },
      });

      setMessage(`Revizyon talebiniz ("${noteText}") kaydedildi ve ${targetDesc} güncellendi.`);
      setTimeout(() => setMessage(null), 4500);
      setRevisionItem(null);
      setRevisionTargetSectionId('all');
      setRevisionNote('');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeTab === 'all') return true;
    return r.type === activeTab;
  });

  const sourceCount = reviews.filter(r => r.type === 'source').length;
  const outlineCount = reviews.filter(r => r.type === 'outline').length;
  const finalCount = reviews.filter(r => r.type === 'final').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Onay Kuyruğu</h1>
        <p className="text-sm text-slate-500 mt-1">
          Aday kaynakları, yazı planlarını ve final taslakları inceleyin. Herhangi bir karta tıklayarak detaylı pop-up ekranda inceleyebilirsiniz.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'border-[#0D9488] text-[#0D9488]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Tümü</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
            {reviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'source'
              ? 'border-[#0D9488] text-[#0D9488]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Kaynak Onayı</span>
          {sourceCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#CCFBF1] text-[#0F766E] font-bold">
              {sourceCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'outline'
              ? 'border-[#0D9488] text-[#0D9488]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>2. Yazı Planı</span>
          {outlineCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              {outlineCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('final')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'final'
              ? 'border-[#0D9488] text-[#0D9488]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Final Onayı</span>
          {finalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 font-bold">
              {finalCount}
            </span>
          )}
        </button>
      </div>

      {/* Review Items List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
          <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Harika! Bekleyen Onay Yok</h3>
          <p className="text-xs text-slate-500 mt-1">
            Seçilen kategoride incelenmeyi bekleyen herhangi bir kaynak veya yazı taslağı bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(item => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-[#14B8A6] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div 
                  onClick={() => setDetailItem(item)}
                  className="space-y-2 flex-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        item.type === 'source'
                          ? 'bg-teal-50 text-[#0D9488] border border-teal-200'
                          : item.type === 'outline'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.type === 'source'
                        ? '1. Aşama • Kaynak'
                        : item.type === 'outline'
                        ? '2. Aşama • Plan'
                        : '3. Aşama • Final Taslak'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="text-[11px] text-[#0D9488] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                      <Maximize2 className="w-3 h-3" />
                      Pop-up ile İncele
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0D9488] transition-colors leading-snug">
                    {item.targetTitle}
                  </h3>

                  {/* Metadata preview */}
                  {item.type === 'source' && item.metadata.sourceSnippet && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5">
                      <p className="italic line-clamp-2">“{item.metadata.sourceSnippet}”</p>
                      {item.metadata.sourceUrl && (
                        <span className="inline-flex items-center gap-1 text-[#0D9488] font-semibold">
                          <span>{item.metadata.sourceUrl.slice(0, 45)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  )}

                  {item.type === 'outline' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">İçerik İskeleti & Kurgu:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                          {item.metadata.outlineSections?.length || item.metadata.outlinePoints?.length || 4} Ana Bölüm
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-[#0F766E] font-bold">
                          ~{item.metadata.estimatedTotalWords || 1500} Kelime Hedefi
                        </span>
                        {item.metadata.targetAudienceSummary && (
                          <span className="text-slate-500 text-[11px] truncate max-w-xs">
                            🎯 {item.metadata.targetAudienceSummary}
                          </span>
                        )}
                      </div>

                      {item.metadata.coreThesis && (
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100 text-[11px] line-clamp-2">
                          💡 <strong>Ana Argüman:</strong> {item.metadata.coreThesis}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                        {(item.metadata.outlineSections || []).slice(0, 4).map((sec, idx) => (
                          <div
                            key={sec.id || idx}
                            className={`bg-white px-2.5 py-1.5 rounded border text-[11px] flex items-center justify-between gap-1 ${
                              sec.scopeDescription.includes('⚡') ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                            }`}
                          >
                            <span className="truncate font-medium text-slate-800">{sec.heading}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">~{sec.estimatedWords}k</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-[#0D9488]">
                        <span className="flex items-center gap-1 font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          Pop-up ile her bölümün kapsamını, savunacağı argümanları ve planlanan atıflarını inceleyin
                        </span>
                      </div>
                    </div>
                  )}

                  {item.type === 'final' && item.metadata.draftPreview && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <p className="font-semibold text-slate-800 mb-1">Üretilen Taslak Özeti:</p>
                      <p className="text-slate-600 line-clamp-2">{item.metadata.draftPreview}</p>
                    </div>
                  )}
                </div>

                {/* Actions: Pop-up Aç, Reddet, Revizyon İste, Onayla */}
                <div className="flex items-center gap-2 shrink-0 sm:pt-1">
                  <button
                    onClick={() => setDetailItem(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Detaylı Pop-up Aç"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>İncele</span>
                  </button>

                  <button
                    onClick={() => handleDecision(item, 'rejected')}
                    disabled={processingId === item.id}
                    className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reddet</span>
                  </button>

                  {(item.type === 'outline' || item.type === 'final') && (
                    <button
                      onClick={() => {
                        setRevisionItem(item);
                        setRevisionNote('');
                      }}
                      disabled={processingId === item.id}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-slate-600" />
                      <span>Revizyon İste</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDecision(item, 'approved')}
                    disabled={processingId === item.id}
                    className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Onayla</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔍 DETAYLI İNCELEME POP-UP MODAL (Kullanıcının İstediği Pop-up) */}
      {/* ============================================================== */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div
            className={`bg-white rounded-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col ${
              detailItem.type === 'outline' ? 'max-w-4xl' : 'max-w-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      detailItem.type === 'source'
                        ? 'bg-teal-50 text-[#0D9488] border border-teal-200'
                        : detailItem.type === 'outline'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {detailItem.type === 'source'
                      ? '1. Aşama • Kaynak İncelemesi'
                      : detailItem.type === 'outline'
                      ? '2. Aşama • Yazı Planı ve Bölüm Mimarisi İncelemesi'
                      : '3. Aşama • Final Blog Taslak İncelemesi'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Oluşturulma: {new Date(detailItem.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {detailItem.targetTitle}
                </h3>
              </div>

              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="py-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              {/* If Source */}
              {detailItem.type === 'source' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Taranan Orijinal Alıntı Metni:
                    </span>
                    <p className="text-slate-800 leading-relaxed text-sm italic">
                      “{detailItem.metadata.sourceSnippet}”
                    </p>
                  </div>

                  {detailItem.metadata.sourceUrl && (
                    <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-slate-500 block text-[10px]">Kaynak URL:</span>
                        <span className="font-mono text-[#0D9488] font-medium truncate block">
                          {detailItem.metadata.sourceUrl}
                        </span>
                      </div>
                      <a
                        href={detailItem.metadata.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#0D9488] text-white rounded-lg font-semibold flex items-center gap-1 shrink-0 ml-3 hover:bg-[#0F766E]"
                      >
                        <span>Kaynağı Aç</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block mb-1">Atıf Anahtarı</span>
                      <span className="font-bold text-[#0D9488] text-sm">
                        [{detailItem.metadata.citationKey || 'S1'}]
                      </span>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block mb-1">Alaka Düzeyi Skoru</span>
                      <span className="font-bold text-emerald-700 text-sm">%92 (Yüksek Uyum)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* If Outline (2. Aşama Plan İncelemesi) */}
              {detailItem.type === 'outline' && (
                <div className="space-y-4">
                  {/* Executive Strategy Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <Target className="w-4 h-4 text-[#0D9488]" />
                        İçerik Stratejisi & Stratejik Odak
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                          Hedef Hacim: ~{detailItem.metadata.estimatedTotalWords || 1500} Kelime
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {detailItem.metadata.outlineSections?.length || 4} Bölüm Mimarisi
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          Hedef Kitle & Okuyucu Profili:
                        </span>
                        <p className="text-slate-800 font-medium">
                          {detailItem.metadata.targetAudienceSummary || 'Endüstriyel Karar Vericiler ve Fabrika Yöneticileri'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Yazının Temel Tezi (Ana Argüman):
                        </span>
                        <p className="text-slate-800 leading-relaxed font-normal">
                          {detailItem.metadata.coreThesis || 'Teşvikler ve leasing ile çatı GES yatırımları nakitsiz başlatılarak amortisman 3.8 yıla iniyor.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setOutlineViewMode('cards')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          outlineViewMode === 'cards'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Bölüm Mimarisi & Kapsam Detayları ({detailItem.metadata.outlineSections?.length || 4})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutlineViewMode('markdown')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          outlineViewMode === 'markdown'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-purple-600" />
                        <span>Markdown İskelet Ağacı</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Her bölümün ne anlatacağını okuyabilir ve bölüme özel revize isteyebilirsiniz
                    </span>
                  </div>

                  {/* Mode 1: Detailed Section Cards */}
                  {outlineViewMode === 'cards' && (
                    <div className="space-y-3.5">
                      {detailItem.metadata.outlineSections && detailItem.metadata.outlineSections.length > 0 ? (
                        detailItem.metadata.outlineSections.map((section, idx) => (
                          <div
                            key={section.id || idx}
                            className={`bg-white border rounded-xl p-4 transition-all shadow-2xs space-y-3 ${
                              section.scopeDescription.includes('⚡')
                                ? 'border-amber-400 bg-amber-50/20'
                                : 'border-slate-200 hover:border-[#14B8A6]'
                            }`}
                          >
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                                  Bölüm {idx + 1}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                                  {section.level?.toUpperCase() || 'H2'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ~{section.estimatedWords} kelime
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenSectionRevision(detailItem, section.id)}
                                className="text-[11px] text-[#0D9488] hover:text-[#0F766E] font-semibold flex items-center gap-1 self-start sm:self-auto px-2.5 py-1 bg-teal-50/70 hover:bg-teal-100 rounded-md transition-colors cursor-pointer border border-teal-200/50"
                              >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                <span>Bu Bölüme Özel Revize İste</span>
                              </button>
                            </div>

                            {/* Heading Title */}
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {section.heading}
                            </h4>

                            {/* Scope Description */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                                Bu Bölümde İşlenecek Kapsam ve İçerik:
                              </span>
                              <p className="leading-relaxed">
                                {section.scopeDescription}
                              </p>
                            </div>

                            {/* Key Arguments */}
                            {section.keyArguments && section.keyArguments.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                                  Savunulacak Temel Argümanlar & Alt Başlıklar:
                                </span>
                                <ul className="space-y-1">
                                  {section.keyArguments.map((arg, aIdx) => (
                                    <li
                                      key={aIdx}
                                      className={`flex items-start gap-2 text-xs leading-normal ${
                                        arg.includes('⚡') ? 'text-amber-800 font-semibold' : 'text-slate-600'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                                      <span>{arg}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Planned Citations */}
                            {section.plannedCitations && section.plannedCitations.length > 0 && (
                              <div className="pt-1 flex flex-wrap items-center gap-1.5 border-t border-slate-100">
                                <span className="text-[10px] font-semibold text-slate-400">Atıf Yapılacak Kaynaklar:</span>
                                {section.plannedCitations.map((cite, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium"
                                  >
                                    {cite}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="space-y-2">
                          {detailItem.metadata.outlinePoints?.map((pt, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                pt.includes('⚡')
                                  ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <ChevronRight className="w-4 h-4 text-[#0D9488] shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Markdown Outline Tree */}
                  {outlineViewMode === 'markdown' && (
                    <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
                      <div className="text-slate-400"># {detailItem.targetTitle.replace('Yazı Planı: ', '')}</div>
                      <div className="text-slate-500">
                        *Hedef Kitle: {detailItem.metadata.targetAudienceSummary || 'Endüstriyel Karar Vericiler'}*
                      </div>
                      <div className="text-slate-500">
                        *Tahmini Hacim: ~{detailItem.metadata.estimatedTotalWords || 1500} Kelime*
                      </div>
                      <div className="py-1 text-slate-600">---</div>

                      {(detailItem.metadata.outlineSections || []).map((sec, idx) => (
                        <div key={idx} className="space-y-1 pl-2 border-l border-slate-700">
                          <div className="text-emerald-400 font-bold">## {sec.heading}</div>
                          <div className="text-slate-400 italic text-[11px]">&gt; Kapsam: {sec.scopeDescription}</div>
                          {sec.keyArguments.map((arg, aIdx) => (
                            <div key={aIdx} className="text-slate-300 text-[11px] pl-3">
                              - {arg}
                            </div>
                          ))}
                          {sec.plannedCitations.length > 0 && (
                            <div className="text-teal-300 text-[10px] pl-3">
                              * Planlanan Atıflar: {sec.plannedCitations.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Bu plan, şirketinizin marka profilindeki hedef kitleye, kanıta dayalı ton kurallarına ve yasaklı terim filtrelerine tam uyumlu olarak kurgulanmıştır.
                    </span>
                  </div>
                </div>
              )}

              {/* If Final Draft */}
              {detailItem.type === 'final' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Üretilen Final Metin Önizlemesi:
                    </span>
                    <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                      {detailItem.metadata.draftPreview}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Onayladığınız takdirde bu yazı &apos;İçerik Hazır&apos; statüsüne geçecek ve CMS/Markdown indirmeye açılacaktır.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDecision(detailItem, 'rejected')}
                disabled={processingId === detailItem.id}
                className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Bu Kaydı Reddet</span>
              </button>

              <div className="flex items-center gap-2">
                {(detailItem.type === 'outline' || detailItem.type === 'final') && (
                  <button
                    onClick={() => {
                      setRevisionItem(detailItem);
                      setRevisionTargetSectionId('all');
                      setRevisionNote('');
                      setDetailItem(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Genel Revizyon İste</span>
                  </button>
                )}

                <button
                  onClick={() => handleDecision(detailItem, 'approved')}
                  disabled={processingId === detailItem.id}
                  className="px-5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Onayla ve İlerlet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Revizyon Talebi Gönder
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>{revisionItem.targetTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setRevisionItem(null);
                  setRevisionTargetSectionId('all');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRevision} className="space-y-4">
              {/* If outline, allow picking specific section or whole outline */}
              {revisionItem.type === 'outline' && revisionItem.metadata.outlineSections && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Revizyon Kapsamı Seçin:
                  </label>
                  <select
                    value={revisionTargetSectionId}
                    onChange={e => setRevisionTargetSectionId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="all">Tüm Yazı Planı (Genel Kurgu & Strateji)</option>
                    {revisionItem.metadata.outlineSections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>
                        Bölüm {idx + 1}: {sec.heading}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Hızlı Yönerge Önerileri:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {revisionTargetSectionId === 'sec-1' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("OSB içi çatı kurulumlarında sağlanan vergi muafiyetini ve şartlarını detaylandır.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + OSB şartlarını detaylandır
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("5. Bölge asgari yatırım teşvik tutarı rakamlarını ekle.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + Asgari yatırım tutarını ekle
                      </button>
                    </>
                  ) : revisionTargetSectionId === 'sec-2' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Leasing faizlerinde döviz kuru riskine karşı hedging taktiklerini dahil et.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + Döviz risklerini dahil et
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("ESCO modelinde enerji tasarrufu kâr paylaşım oranlarını belirt.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + ESCO kâr paylaşımını ekle
                      </button>
                    </>
                  ) : revisionTargetSectionId === 'sec-3' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Amortisman süresini 3.5 yıla göre optimize et ve inverter yenileme masrafını netleştir.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + 3.5 yıl amortisman hesabı
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Yıllık panel verim kaybını (%0.5) amortisman tablosuna ekle.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + Verim kaybı projeksiyonu
                      </button>
                    </>
                  ) : revisionTargetSectionId === 'sec-4' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Statik çatı yükü analizinde itfaiye onay adımlarını kontrol listesine dönüştür.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + İtfaiye kontrol listesi ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Çağrı mektubu için son başvuru takvimini uyar.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + Çağrı mektubu takvimi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Daha kurumsal, CFO ve yatırımcı odaklı analitik bir dil kullan.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + CFO odaklı dil
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevisionNote("Başlıklara 2026 yılı güncel mevzuat vurgusunu artır.")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        + 2026 mevzuat vurgusu
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Yapay Zekaya İletilecek Revizyon Yönergesi:
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                  placeholder="Yapay zekanın değiştirmesini veya plana eklemesini istediğiniz detayları yazın..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRevisionItem(null);
                    setRevisionTargetSectionId('all');
                  }}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!revisionNote.trim()}
                  className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Revizyon Talebini Uygula</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
