'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  History,
  CheckCircle2,
  Edit3,
  Download,
  ChevronDown,
  Info,
  ExternalLink,
  Settings,
  Sparkles,
  Globe,
  Share2,
} from 'lucide-react';
import { GenerateArticleModal } from './GenerateArticleModal';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { ContentItem, ContentVersion, CandidateSource } from '@/types';

export function ContentDetailView() {
  const { activeTenant, user } = useAuth();
  const provider = getDataProvider();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [sources, setSources] = useState<CandidateSource[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'sources' | 'history'>('text');
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBodyText, setEditBodyText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const handleCmsPublish = (target: string) => {
    setShowExportMenu(false);
    setNotification(
      `Yazı başarıyla ${target} entegrasyonuna gönderildi! (Durum: Taslak Olarak Hazırlandı)`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    async function loadData() {
      if (!activeTenant) return;
      const items = await provider.listContentItems(activeTenant.id);
      const readyItem = items.find(i => i.status === 'ready') || items[0];
      if (readyItem) {
        setContent(readyItem);
        const itemSources = await provider.listSources(activeTenant.id);
        setSources(itemSources.filter(s => readyItem.sourceIds.includes(s.id)));
        const itemVersions = await provider.getContentVersions(readyItem.id);
        setVersions(itemVersions);
        setEditBodyText(itemVersions[0]?.bodyMarkdown || '');
      } else {
        setContent(null);
        setSources([]);
        setVersions([]);
      }
    }
    loadData();
  }, [activeTenant, provider]);

  const handleCreateDraft = async () => {
    if (!content || !activeTenant || !user) return;
    try {
      const newDraft = await provider.createNewDraftVersion(
        activeTenant.id,
        content.id,
        user.id,
        user.fullName
      );
      setVersions(prev => [newDraft, ...prev]);
      setIsEditing(true);
      setNotification(`Yeni taslak sürümü (v${newDraft.versionNumber}) oluşturuldu.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Taslak oluşturulamadı.');
    }
  };

  const handleDownloadMarkdown = (format: 'plain' | 'frontmatter' = 'plain') => {
    if (!content) return;
    const currentVersion = versions[0];
    let mdContent = '';

    if (format === 'frontmatter') {
      mdContent = `---
title: "${content.seoTitle || content.title}"
description: "${content.metaDescription}"
slug: "${content.slug}"
focus_keyword: "${content.focusKeyword}"
company: "${activeTenant?.name}"
brand_profile_version: "v${content.brandProfileVersion}"
author: "${content.authorName}"
date: "${content.updatedAt.slice(0, 10)}"
---

# ${content.title}

${currentVersion?.bodyMarkdown || ''}

## Kaynaklar ve Referanslar
${sources.map(s => `- [${s.citationKey}] ${s.title}: ${s.url}`).join('\n')}
`;
    } else {
      mdContent = `# ${content.title}

${currentVersion?.bodyMarkdown || ''}

---
**Kaynaklar:**
${sources.map(s => `- [${s.citationKey}] ${s.title} (${s.url})`).join('\n')}
`;
    }

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${content.slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (!content) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-xl mx-auto my-12">
        <Sparkles className="w-12 h-12 text-[#14B8A6] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Henüz Tamamlanmış İçerik Yok</h3>
        <p className="text-sm text-slate-500 mt-1">
          {activeTenant?.name} için onay sürecini tamamlamak üzere Onay Kuyruğu veya Kaynak Tarama sekmesini ziyaret edebilirsiniz.
        </p>
      </div>
    );
  }

  const currentVersion = versions[0];

  return (
    <div className="space-y-6 pb-16">
      {notification && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold hover:underline">
            Kapat
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">İçerik hazır</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Editör onayından geçen yazınız dışa aktarılabilir.
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#14B8A6]" />
            <span>Yeni Blog Üret</span>
          </button>

          <button
            onClick={handleCreateDraft}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-300 rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>Düzenle</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Dışa Aktar</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 divide-y divide-slate-100">
                <div className="py-1">
                  <button
                    onClick={() => handleDownloadMarkdown('plain')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Düz Markdown (.md)</span>
                    <span className="text-[10px] text-slate-400">Standart</span>
                  </button>
                  <button
                    onClick={() => handleDownloadMarkdown('frontmatter')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>SEO Meta ile (.md)</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Frontmatter</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => handleCmsPublish('WordPress REST API')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>WordPress&apos;e Gönder</span>
                  </button>
                  <button
                    onClick={() => handleCmsPublish('Webhook (Otomasyon)')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Webhook İle Tetikle</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Process Stepper matching reference screenshot */}
      <div className="bg-white border border-slate-200 rounded-xl px-8 py-5">
        <div className="relative flex items-center justify-between">
          {/* Green Connecting Line */}
          <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-[#10B981] -z-0" />

          {/* Step 1: Kaynak onayı */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 fill-[#10B981] text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700">Kaynak onayı</span>
          </div>

          {/* Step 2: Yazı planı */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 fill-[#10B981] text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700">Yazı planı</span>
          </div>

          {/* Step 3: Final onayı */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 fill-[#10B981] text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700">Final onayı</span>
          </div>

          {/* Step 4: Tamamlandı */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 fill-[#10B981] text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700">Tamamlandı</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (approx 68% / 32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~68%) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {/* Card Tabs */}
          <div className="flex items-center gap-6 px-6 border-b border-slate-200 text-sm">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-3.5 flex items-center gap-2 font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-[#0D9488] text-[#0D9488] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Yazı</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`py-3.5 flex items-center gap-2 font-medium border-b-2 transition-colors ${
                activeTab === 'sources'
                  ? 'border-[#0D9488] text-[#0D9488] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kaynaklar</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-3.5 flex items-center gap-2 font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-[#0D9488] text-[#0D9488] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Sürüm geçmişi</span>
            </button>
          </div>

          {/* Tab 1: Yazı (Article Body matching screenshot) */}
          {activeTab === 'text' && (
            <div className="p-8">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Onaylandı
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {content.category || 'Blog'}
                </span>
              </div>

              {/* Title & Meta Row */}
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                {content.title}
              </h2>

              <p className="text-xs text-slate-500 mt-2 pb-6 border-b border-slate-100 flex items-center gap-2">
                <span>{activeTenant?.name}</span>
                <span>•</span>
                <span>Marka profili v{content.brandProfileVersion}</span>
                <span>•</span>
                <span>{sources.length} kaynak</span>
                {currentVersion && currentVersion.versionNumber > 1 && (
                  <>
                    <span>•</span>
                    <span className="text-[#0D9488] font-medium">Sürüm v{currentVersion.versionNumber}</span>
                  </>
                )}
              </p>

              {/* Body Content */}
              {isEditing ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Taslak Düzenleyici (v{content.currentVersionNumber})</span>
                    <span>Kaynak atıflarını [S1], [S2] formatında koruyun.</span>
                  </div>
                  <textarea
                    value={editBodyText}
                    onChange={e => setEditBodyText(e.target.value)}
                    rows={16}
                    className="w-full text-sm font-sans p-4 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      İptal
                    </button>
                    <button
                      onClick={async () => {
                        if (currentVersion) {
                          await provider.updateContentVersion(activeTenant!.id, currentVersion.id, {
                            bodyMarkdown: editBodyText,
                          });
                          setIsEditing(false);
                          setNotification('Taslak değişiklikleri kaydedildi.');
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-semibold bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E]"
                    >
                      Taslağı Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-slate-700">
                  <p>
                    Güneş enerjisi, temiz ve sürdürülebilir bir gelecek için en önemli kaynaklardan biri olmaya devam ediyor. Son yıllarda hem teknolojik gelişmeler hem de maliyetlerdeki düşüş, güneş enerjisini bireyler ve işletmeler için daha erişilebilir hale getirdi. Ancak asıl odak noktası artık yalnızca kurulu kapasiteyi artırmak değil; mevcut sistemlerden daha yüksek verimlilik elde etmek.
                  </p>

                  <p>
                    Bu yazıda, güneş enerjisinde verimliliği artıran güncel yaklaşımları, bu yaklaşımların işletmelere sağlayabileceği faydaları ve değerlendirme sürecinde dikkate alınması gereken ölçütleri ele alıyoruz.
                  </p>

                  <h3 className="text-lg font-bold text-slate-900 pt-2">
                    Verimlilik neden önemli?
                  </h3>

                  <p>
                    Güneş enerjisi santrallerinin verimliliği, aynı alandan daha fazla enerji üretmek ve yatırımların geri dönüş süresini kısaltmak açısından kritik bir rol oynar. Daha verimli sistemler, hem ekonomik fayda sağlar hem de çevresel etkiyi azaltarak sürdürülebilirlik hedeflerine katkıda bulunur.{' '}
                    <span className="font-semibold text-[#0D9488] bg-[#F0FDFA] px-1.5 py-0.5 rounded cursor-pointer hover:underline" title="Örnek sektör raporu [S1]">
                      [S1]
                    </span>
                  </p>

                  <h3 className="text-lg font-bold text-slate-900 pt-2">
                    İşletmeler için değerlendirme ölçütleri
                  </h3>

                  <p>
                    İşletmeler, güneş enerjisi yatırımlarında teknolojik seçenekleri değerlendirirken panel verimliliği, sistem tasarımı, bakım gereksinimleri ve toplam sahip olma maliyeti gibi ölçütleri dikkate almalıdır. Ayrıca, sahaya özgü analizler ve uzun vadeli performans verileri, doğru teknoloji seçiminde belirleyici olabilir.{' '}
                    <span className="font-semibold text-[#0D9488] bg-[#F0FDFA] px-1.5 py-0.5 rounded cursor-pointer hover:underline" title="Örnek araştırma notu [S2]">
                      [S2]
                    </span>
                  </p>

                  <p>
                    Saha deneyimleri gösteriyor ki, periyodik denetim ve akıllı izleme araçlarıyla desteklenen paneller, işletme ömrü boyunca öngörülen performans eğrisini %98 oranında koruyabilmektedir.{' '}
                    <span className="font-semibold text-[#0D9488] bg-[#F0FDFA] px-1.5 py-0.5 rounded cursor-pointer hover:underline" title="Örnek şirket açıklaması [S3]">
                      [S3]
                    </span>
                  </p>

                  {/* Footnote matching screenshot */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Örnek içerik • Araştırma ve üretim bu demoda simüle edilmiştir.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Kaynaklar */}
          {activeTab === 'sources' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Metin İçinde Kullanılan Kaynaklar</h3>
              <div className="space-y-3">
                {sources.map(src => (
                  <div key={src.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <span className="text-[#0D9488]">[{src.citationKey}]</span> {src.title}
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Uyum: %{src.relevanceScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{src.snippet}</p>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#0D9488] hover:underline mt-2 font-medium"
                    >
                      <span>Kaynağı Görüntüle</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Sürüm Geçmişi */}
          {activeTab === 'history' && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Versiyon ve Değişiklik Geçmişi</h3>
              <div className="space-y-3">
                {versions.map((ver, idx) => (
                  <div key={ver.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>Sürüm v{ver.versionNumber}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-[#0D9488] text-white px-2 py-0.5 rounded-full font-semibold">
                            Aktif Sürüm
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Oluşturan: {content.authorName} • {new Date(ver.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      {ver.status === 'ready' ? 'Tamamlandı' : 'Taslak'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (~32%) matching screenshot */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: SEO Bilgileri */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">SEO bilgileri</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SEO başlığı</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 break-words leading-relaxed">
                {content.seoTitle}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta açıklaması</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                {content.metaDescription}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 truncate">
                {content.slug}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Odak anahtar kelime</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                {content.focusKeyword}
              </div>
            </div>
          </div>

          {/* Card 2: Kaynaklar List matching screenshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">Kaynaklar</h3>
            </div>

            <div className="space-y-2.5">
              {sources.map(src => (
                <div key={src.id} className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <FileText className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {src.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {src.summary || src.snippet}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Demo kaynaklardır. Gerçek bir yayını temsil etmez.</span>
            </div>
          </div>

          {/* Card 3: Üretim Bilgileri matching screenshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">Üretim bilgileri</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Marka profili</span>
                <span className="font-semibold text-slate-800">v{content.brandProfileVersion}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Editör</span>
                <span className="font-semibold text-slate-800">{content.authorName}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Durum</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tamamlandı
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: SEO & Okunabilirlik Puanı (Yeni Gelişmiş Özellik) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-bold text-slate-800">SEO & Kalite Skoru</h3>
              </div>
              <span className="text-xs font-bold text-[#0D9488] bg-[#F0FDFA] px-2 py-0.5 rounded-full border border-[#99F6E4]">
                94 / 100
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Okunabilirlik İndeksi</span>
                <span className="font-semibold text-emerald-700">86/100 (Akıcı & Sade)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Odak Kelime Yoğunluğu</span>
                <span className="font-semibold text-slate-800">%2.4 (İdeal Aralık)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Doğrulanmış Kaynak Atfı</span>
                <span className="font-semibold text-slate-800">{sources.length} Kaynak ([S1]-[S3])</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generate Article Wizard Modal */}
      <GenerateArticleModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        approvedSources={sources}
        onArticleGenerated={async (newId) => {
          if (!activeTenant) return;
          const freshItem = await provider.getContentItem(activeTenant.id, newId);
          if (freshItem) {
            setContent(freshItem);
            setNotification(`"${freshItem.title}" başlıklı yeni blog yazısı yapay zeka tarafından başarıyla üretildi!`);
            setTimeout(() => setNotification(null), 5000);
          }
        }}
      />
    </div>
  );
}
