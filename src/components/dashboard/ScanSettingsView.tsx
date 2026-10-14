'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Key,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { Keyword, ScanSettings, Job } from '@/types';

export function ScanSettingsView() {
  const { activeTenant, user } = useAuth();
  const provider = getDataProvider();

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [settings, setSettings] = useState<ScanSettings | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('Birincil Odak');
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!activeTenant) return;
    const kwList = await provider.listKeywords(activeTenant.id);
    setKeywords(kwList);

    const stg = await provider.getScanSettings(activeTenant.id);
    setSettings(stg);

    const jobs = await provider.listRecentJobs(activeTenant.id);
    setRecentJobs(jobs);

    const isRunning = jobs.some(j => j.status === 'running' && j.type === 'scan');
    setIsScanning(isRunning);
  }, [activeTenant, provider]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !newKeyword.trim()) return;
    try {
      await provider.addKeyword(activeTenant.id, newKeyword.trim(), newCategory);
      setNewKeyword('');
      setNotification({
        type: 'success',
        message: 'Anahtar kelime eklendi. (Not: Otomatik tarama tetiklenmedi; dilediğinizde aşağıdaki butonla başlatabilirsiniz).',
      });
      setTimeout(() => setNotification(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ekleme başarısız.');
    }
  };

  const handleRemoveKeyword = async (id: string) => {
    if (!activeTenant) return;
    await provider.removeKeyword(activeTenant.id, id);
    await loadData();
  };

  const handleToggleKeyword = async (id: string) => {
    if (!activeTenant) return;
    await provider.toggleKeyword(activeTenant.id, id);
    await loadData();
  };

  const handleTriggerScan = async () => {
    if (!activeTenant || !user || isScanning) return;
    setIsScanning(true);
    setNotification(null);

    try {
      const res = await fetch('/api/scan/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          actorUserId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tarama başlatılamadı.');
      }

      if (data.alreadyRunning) {
        setNotification({
          type: 'error',
          message: 'Bu şirket için devam eden bir tarama işi zaten mevcut.',
        });
      } else {
        setNotification({
          type: 'success',
          message: `Kaynak taraması başlatıldı. İş ID: ${data.job.id}. Sonuçlar Onay Kuyruğu sekmesine aktarılacaktır.`,
        });
      }

      await loadData();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'İşlem sırasında hata oluştu.',
      });
    } finally {
      // Re-check after 3 seconds
      setTimeout(async () => {
        await loadData();
        setIsScanning(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tarama Ayarları ve Konu Araştırma</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeTenant?.name} için web kaynak taramasında aranacak odak anahtar kelimeleri ve parametreleri belirleyin.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Manual Scan Trigger Card */}
      <div className="bg-gradient-to-r from-[#0B132B] to-[#152238] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#1E293B]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14B8A6] uppercase tracking-wider">
            <Search className="w-4 h-4" />
            <span>Ortak n8n Ajanı</span>
          </div>
          <h2 className="text-xl font-bold text-white">Kaynak Taramasını Başlat</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Şirketinizin aktif {keywords.filter(k => k.isActive).length} anahtar kelimesi ve marka profili kriterleri ile en güncel sektörel raporları ve makaleleri tarar. Çift tetikleme koruması aktiftir.
          </p>
        </div>

        <button
          onClick={handleTriggerScan}
          disabled={isScanning || keywords.filter(k => k.isActive).length === 0}
          className="px-6 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-700 text-white font-semibold text-sm rounded-xl shadow-lg flex items-center gap-2.5 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Tarama Devam Ediyor...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Kaynak Taramasını Başlat</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Keywords Management (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Aktif Anahtar Kelimeler</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {keywords.filter(k => k.isActive).length} / {keywords.length} aktif
            </span>
          </div>

          {/* Add keyword form */}
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              type="text"
              placeholder="Yeni anahtar kelime girin..."
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="Birincil Odak">Birincil Odak</option>
              <option value="Sektör / Pazar">Sektör / Pazar</option>
              <option value="Teknoloji">Teknoloji</option>
              <option value="Ürün / Hizmet">Ürün / Hizmet</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ekle</span>
            </button>
          </form>

          {/* Keywords List */}
          <div className="space-y-2">
            {keywords.map(kw => (
              <div
                key={kw.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={kw.isActive}
                    onChange={() => handleToggleKeyword(kw.id)}
                    className="w-4 h-4 text-[#0D9488] rounded-sm focus:ring-[#0D9488] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-semibold ${kw.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {kw.keyword}
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-full font-medium">
                      {kw.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveKeyword(kw.id)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Tarama Parametreleri</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Her Taramada Hedef Kaynak Sayısı
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={settings?.targetCountPerRun || 5}
                onChange={async e => {
                  const val = parseInt(e.target.value) || 5;
                  if (activeTenant) {
                    await provider.updateScanSettings(activeTenant.id, { targetCountPerRun: val });
                    setSettings(prev => (prev ? { ...prev, targetCountPerRun: val } : null));
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Önerilen değer: 5 aday kaynak
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Alaka Düzeyi Skoru (0 - 100)
              </label>
              <input
                type="number"
                min={50}
                max={95}
                value={settings?.minRelevanceScore || 70}
                onChange={async e => {
                  const val = parseInt(e.target.value) || 70;
                  if (activeTenant) {
                    await provider.updateScanSettings(activeTenant.id, { minRelevanceScore: val });
                    setSettings(prev => (prev ? { ...prev, minRelevanceScore: val } : null));
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0D9488]"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Bu skorun altındaki kaynaklar otomatik elenir.
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.autoSummarize ?? true}
                  onChange={async e => {
                    const checked = e.target.checked;
                    if (activeTenant) {
                      await provider.updateScanSettings(activeTenant.id, { autoSummarize: checked });
                      setSettings(prev => (prev ? { ...prev, autoSummarize: checked } : null));
                    }
                  }}
                  className="w-4 h-4 text-[#0D9488] rounded-sm focus:ring-[#0D9488] border-slate-300"
                />
                <span className="font-semibold text-slate-700">Aday kaynakları otomatik özetle</span>
              </label>
            </div>
          </div>

          {/* Recent Jobs in this tenant */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Son Tarama İşleri</h4>
            <div className="space-y-1.5">
              {recentJobs.slice(0, 3).map(j => (
                <div key={j.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] flex items-center justify-between">
                  <span className="font-mono text-slate-600">{j.id.slice(0, 15)}...</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    j.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    j.status === 'running' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {j.status === 'completed' ? 'Tamamlandı' : j.status === 'running' ? 'Çalışıyor' : j.status}
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
