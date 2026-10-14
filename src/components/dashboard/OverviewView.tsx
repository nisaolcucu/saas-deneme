'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckSquare,
  BookOpen,
  Key,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { ContentItem, CandidateSource } from '@/types';
import { NavTab } from '../layout/Sidebar';

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const { activeTenant, userRole } = useAuth();
  const provider = getDataProvider();

  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [sourcesList, setSourcesList] = useState<CandidateSource[]>([]);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [keywordsCount, setKeywordsCount] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      if (!activeTenant) return;
      const items = await provider.listContentItems(activeTenant.id);
      setContentList(items);

      const srcs = await provider.listSources(activeTenant.id);
      setSourcesList(srcs);

      const revs = await provider.listReviewItems(activeTenant.id);
      setReviewCount(revs.length);

      const kws = await provider.listKeywords(activeTenant.id);
      setKeywordsCount(kws.filter(k => k.isActive).length);
    }
    loadStats();
  }, [activeTenant, provider]);

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0D9488]">
            <Building2 className="w-4 h-4" />
            <span>{activeTenant?.name} Paneli</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Rol: {userRole === 'tenant_admin' ? 'Şirket Yöneticisi' : 'Editör'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            İçerik Otomasyonu Genel Bakış
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Ortak yapay zeka otomasyon motorumuz şirketinizin marka profiline ve anahtar kelimelerine göre kaynakları tarar, plan oluşturur ve editör onayına sunar.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('scan_settings')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-600" />
            <span>Tarama Başlat</span>
          </button>

          <button
            onClick={() => onNavigate('content_detail')}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Hazır İçeriği Aç</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          onClick={() => onNavigate('content_detail')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-[#14B8A6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tamamlanan Bloglar</span>
            <FileText className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {contentList.filter(c => c.status === 'ready' || c.status === 'published').length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">İçerik hazır</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => onNavigate('review_queue')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-[#14B8A6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Onay Bekleyenler</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{reviewCount}</span>
            <span className="text-xs text-amber-600 font-medium">Kuyrukta</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => onNavigate('content_detail')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-[#14B8A6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Taranan Kaynaklar</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{sourcesList.length}</span>
            <span className="text-xs text-blue-600 font-medium">Toplam tespit</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => onNavigate('scan_settings')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-[#14B8A6] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Aktif Kelimeler</span>
            <Key className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{keywordsCount}</span>
            <span className="text-xs text-purple-600 font-medium">Hedef anahtar</span>
          </div>
        </div>
      </div>

      {/* Content List & Pipeline Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Son Blog İçerikleri</h3>
            <p className="text-xs text-slate-500">Şirketiniz için üretilen ve onaylanan yazılar</p>
          </div>
          <button
            onClick={() => onNavigate('content_detail')}
            className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
          >
            <span>Detayları Görüntüle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {contentList.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Bu şirket için henüz oluşturulmuş bir içerik yok.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {contentList.map(item => (
              <div 
                key={item.id} 
                onClick={() => onNavigate('content_detail')}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-1 truncate max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                      {item.status === 'ready' ? 'İçerik Hazır' : item.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span>Marka Profili v{item.brandProfileVersion}</span>
                    <span>{item.wordCount} kelime</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-[#0D9488] hover:underline">
                    İncele →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
