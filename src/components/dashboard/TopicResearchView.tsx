'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  CheckCircle2,
  Filter,
  Flame,
  Globe2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';

interface SuggestedTopic {
  id: string;
  title: string;
  category: string;
  intent: 'Bilgilendirici' | 'Karşılaştırma' | 'Ticari / Rehber';
  searchVolume: string;
  trendScore: number; // 0-100
  potentialAngle: string;
  isAdded?: boolean;
}

export function TopicResearchView() {
  const { activeTenant } = useAuth();
  const provider = getDataProvider();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initial tailored recommendations based on company
  const isSolar = activeTenant?.slug.includes('yesil');
  const isSocks = activeTenant?.slug.includes('pamuk');

  const defaultTopics: SuggestedTopic[] = isSolar
    ? [
        {
          id: 'top-1',
          title: '2026 Endüstriyel Çatı GES Teşvikleri ve Vergi Avantajları',
          category: 'Mevzuat & Teşvik',
          intent: 'Ticari / Rehber',
          searchVolume: '4.8K / ay',
          trendScore: 96,
          potentialAngle: 'Fabrika sahipleri için güncel KDV ve amortisman istisnalarının net ROI analizi.',
        },
        {
          id: 'top-2',
          title: 'Monokristal vs TOPCon Panel: Hangisi Daha Hızlı Geri Döner?',
          category: 'Teknoloji',
          intent: 'Karşılaştırma',
          searchVolume: '3.2K / ay',
          trendScore: 91,
          potentialAngle: 'Farklı iklim koşullarındaki yıllık degradasyon oranlarının karşılaştırmalı tablosu.',
        },
        {
          id: 'top-3',
          title: 'Sanayi Tesislerinde Lityum Depolama (BESS) Entegrasyonu',
          category: 'Depolama',
          intent: 'Bilgilendirici',
          searchVolume: '2.5K / ay',
          trendScore: 88,
          potentialAngle: 'Pik saat tarifesinden tasarruf sağlamak için batarya kapasitesi hesaplama yöntemleri.',
        },
        {
          id: 'top-4',
          title: 'GES Santrallerinde Termal Drone ile Sıcak Nokta (Hotspot) Tespiti',
          category: 'Bakım & İşletme',
          intent: 'Bilgilendirici',
          searchVolume: '1.9K / ay',
          trendScore: 84,
          potentialAngle: 'Görünmeyen hücre çatlaklarının yıllık %12 üretim kaybına yol açmasının önlenmesi.',
        },
      ]
    : isSocks
    ? [
        {
          id: 'top-p1',
          title: 'Diyabet Hastaları İçin Dikişsiz Çorap Neden Hayatidir?',
          category: 'Sağlık',
          intent: 'Bilgilendirici',
          searchVolume: '5.4K / ay',
          trendScore: 94,
          potentialAngle: 'Baskı yapmayan lastik yapısı ve sürtünmesiz burun dikişinin kan dolaşımına etkisi.',
        },
        {
          id: 'top-p2',
          title: 'Bambu vs Organik Pamuk: Terletmeyen Çorap Seçimi',
          category: 'Kumaş Teknolojisi',
          intent: 'Karşılaştırma',
          searchVolume: '6.1K / ay',
          trendScore: 92,
          potentialAngle: 'Doğal antibakteriyel özellikler ve nem transfer testlerinin sonuçları.',
        },
      ]
    : [
        {
          id: 'top-i1',
          title: '2026 SaaS Şirketlerinde Çok Kiracılı (Multi-Tenant) Mimari',
          category: 'Yazılım Mimarisi',
          intent: 'Bilgilendirici',
          searchVolume: '3.9K / ay',
          trendScore: 95,
          potentialAngle: 'PostgreSQL Row Level Security (RLS) ile tek veritabanında tam veri izolasyonu.',
        },
      ];

  const [topicList, setTopicList] = useState<SuggestedTopic[]>(defaultTopics);

  const handleAddToKeywords = async (topic: SuggestedTopic) => {
    if (!activeTenant) return;
    try {
      await provider.addKeyword(activeTenant.id, topic.title, topic.category);
      setTopicList(prev =>
        prev.map(t => (t.id === topic.id ? { ...t, isAdded: true } : t))
      );
      setNotification(
        `"${topic.title}" konusu aktif anahtar kelimelerinize başarıyla eklendi! Tarama Ayarları sayfasından dilediğinizde taratabilirsiniz.`
      );
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Eklenemedi');
    }
  };

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    setTimeout(() => {
      const generated: SuggestedTopic = {
        id: `topic-${Date.now()}`,
        title: `${searchQuery.trim()} Konusunda 2026 Trendleri ve Çözümler`,
        category: 'Yapay Zeka Keşfi',
        intent: 'Bilgilendirici',
        searchVolume: '3.4K / ay',
        trendScore: 93,
        potentialAngle: `${searchQuery.trim()} alanında kullanıcıların en çok sorduğu sorular ve pazar boşlukları.`,
      };
      setTopicList(prev => [generated, ...prev]);
      setIsSearching(false);
      setNotification(`"${searchQuery}" ana fikri için yeni potansiyel konu başlığı üretildi.`);
      setTimeout(() => setNotification(null), 4000);
    }, 700);
  };

  const categories = ['Tümü', ...Array.from(new Set(topicList.map(t => t.category)))];

  const filteredTopics = topicList.filter(t => {
    if (selectedCategory !== 'Tümü' && t.category !== selectedCategory) return false;
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-1">
          <Globe2 className="w-4 h-4" />
          <span>Sektörel İstihbarat & Fikir Motoru</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Konu Araştır</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeTenant?.name} için internetteki arama hacimlerini, sektör trendlerini ve henüz yazılmamış fırsat başlıklarını keşfedin.
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search & AI Topic Generator Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Bir kavram veya odak kelime girin (Örn: depolama, teşvik, organik pamuk)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSearching ? 'Fikirler Taranıyor...' : 'Yeni Konu Fikri Üret'}</span>
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Kategori:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTopics.map(topic => (
          <div
            key={topic.id}
            className="bg-white border border-slate-200 hover:border-[#14B8A6] rounded-xl p-5 shadow-2xs transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {topic.category}
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    Trend: %{topic.trendScore}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium">{topic.searchVolume}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {topic.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-slate-800">İçerik Açısı:</strong> {topic.potentialAngle}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Niyet: <strong className="text-slate-800">{topic.intent}</strong>
              </span>

              {topic.isAdded ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kelimelere Eklendi</span>
                </span>
              ) : (
                <button
                  onClick={() => handleAddToKeywords(topic)}
                  className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Taramaya & Kelimelere Ekle</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
