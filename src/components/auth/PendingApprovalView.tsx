'use client';

import React from 'react';
import { Clock, Building2, CheckCircle2, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function PendingApprovalView() {
  const { user, pendingApplication, loginAs, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-end gap-1 h-5">
            <span className="w-1.5 h-2.5 bg-[#14B8A6] rounded-full" />
            <span className="w-1.5 h-5 bg-[#14B8A6] rounded-full" />
            <span className="w-1.5 h-3.5 bg-[#14B8A6] rounded-full" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">blogüret</span>
        </div>

        {/* Icon & Title */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Başvurunuz Değerlendiriliyor</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Hesabınız oluşturuldu ancak şirket paneline ve içerik verilerine erişebilmeniz için Süper Admin onayı beklenmektedir.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Şirket Adı:</span>
            <span className="font-bold text-slate-800">
              {pendingApplication?.companyName || 'Belirtilmedi'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Başvuran:</span>
            <span className="font-semibold text-slate-800">{user?.fullName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Durum:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Onay Bekliyor
            </span>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-3 pt-2 text-left text-xs">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">1. Kayıt başvurusu başarıyla alındı.</span>
          </div>

          <div className="flex items-center gap-3 text-amber-700">
            <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
            <span className="font-semibold">2. Süper Admin başvuruyu inceliyor...</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>3. Şirket hesabı ve paneli açılacak.</span>
          </div>
        </div>

        {/* Demo Fast-Track Button */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => loginAs('user-superadmin')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Demo: Süper Admin Hesabına Geç (Onayla)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logout}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Farklı Hesapla Giriş Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
