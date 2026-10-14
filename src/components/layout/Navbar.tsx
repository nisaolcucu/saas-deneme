'use client';

import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, LogOut, Building, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavTab } from './Sidebar';

interface NavbarProps {
  breadcrumbTitle?: string;
  onBack?: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export function Navbar({ breadcrumbTitle = 'İçerikler / Blog detayı', onBack, onNavigateTab }: NavbarProps) {
  const { user, activeTenant, isSuperAdmin, userRole, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 select-none">
      {/* Left: Breadcrumbs matching screenshot */}
      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
        <button
          onClick={onBack}
          className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
          title="Geri Dön"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>İçerikler</span>
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs md:max-w-md">
          {breadcrumbTitle.includes('/') ? breadcrumbTitle.split('/')[1]?.trim() || 'Blog detayı' : breadcrumbTitle}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Amber Demo Mode Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs font-semibold">
          <span>⚠️</span>
          <span>Demo modu</span>
        </div>

        {/* Help Icon */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Sistem ve Mimari Yardımı"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-[#CCFBF1] text-[#0F766E] font-bold text-xs flex items-center justify-center border border-[#99F6E4] hover:opacity-90 transition-opacity cursor-pointer"
            title={`${user?.fullName || 'Kullanıcı'} (${user?.email})`}
          >
            {user?.avatarInitials || 'KU'}
          </button>

          {/* User Account Details Dropdown (Private to Current User) */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#CCFBF1] text-[#0F766E] font-bold text-sm flex items-center justify-center border border-[#99F6E4] shrink-0">
                  {user?.avatarInitials || 'KU'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-tight truncate">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Company & Role Details */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Aktif Şirket
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                    <Building className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span className="truncate">{activeTenant?.name || 'Bağlı Şirket Yok'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Yetki Seviyesi
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSuperAdmin ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Platform Süper Admin
                      </span>
                    ) : userRole === 'tenant_admin' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                        Şirket Yöneticisi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        İçerik Editörü
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Oturum Durumu</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Güvenli Giriş
                  </span>
                </div>
              </div>

              {/* If Super Admin, direct shortcut to Admin Panel */}
              {isSuperAdmin && onNavigateTab && (
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      onNavigateTab('super_admin');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-amber-700 bg-amber-50/60 hover:bg-amber-100/60 rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Süper Admin Paneli&apos;ne Git</span>
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div className="px-2 pt-2">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Güvenli Çıkış Yap</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">blogüret Platform Mimarisi</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bu uygulama, birden fazla şirketin aynı yapay zeka otomasyon altyapısını tamamen izole marka profilleri, kaynakları ve içerikleriyle kullanabildiği çok kiracılı (multi-tenant) bir SaaS platformudur.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-[#0D9488] font-bold">✓</span>
                <span><strong>Ortak n8n Akışı:</strong> Şirketlere özel kopyalar üretilmez; ortak akış ilgili şirketin parametreleriyle çalışır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0D9488] font-bold">✓</span>
                <span><strong>Kesin Şirket İzolasyonu:</strong> Bir şirketin editörü diğer şirketin verilerine erişemez.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0D9488] font-bold">✓</span>
                <span><strong>Süper Admin Denetimi:</strong> Yeni başvuruları onaylar ve tüm şirketlerin iş akışlarını izler.</span>
              </li>
            </ul>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
