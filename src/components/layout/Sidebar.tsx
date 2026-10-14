'use client';

import React from 'react';
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  FileText,
  Bookmark,
  Sliders,
  Users,
  Calendar,
  PenTool,
  ShieldAlert,
  ChevronDown,
  Building2,
  Leaf,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export type NavTab = 
  | 'overview' 
  | 'search' 
  | 'review_queue' 
  | 'content_detail' 
  | 'brand_profile' 
  | 'scan_settings' 
  | 'team' 
  | 'super_admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewsCount: number;
}

export function Sidebar({ currentTab, onSelectTab, pendingReviewsCount }: SidebarProps) {
  const { activeTenant, accessibleTenants, isSuperAdmin, switchTenant } = useAuth();
  const [showTenantDropdown, setShowTenantDropdown] = React.useState(false);

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col h-screen shrink-0 border-r border-[#1E293B] select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 gap-2.5">
        <div className="flex items-end gap-1 h-6">
          <span className="w-1.5 h-3 bg-[#14B8A6] rounded-full animate-pulse" />
          <span className="w-1.5 h-6 bg-[#14B8A6] rounded-full" />
          <span className="w-1.5 h-4 bg-[#14B8A6] rounded-full" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-sans">
          blogüret
        </span>
      </div>

      {/* Company Selector Card */}
      <div className="px-4 py-2 relative">
        <div 
          onClick={() => {
            if (accessibleTenants.length > 1) {
              setShowTenantDropdown(!showTenantDropdown);
            }
          }}
          className={`bg-[#152238] hover:bg-[#1C2C47] text-white rounded-lg p-2.5 flex items-center justify-between border border-[#1E2E4A] transition-colors ${accessibleTenants.length > 1 ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-[#0D9488]/20 flex items-center justify-center text-[#14B8A6] shrink-0">
              {activeTenant?.slug.includes('yesil') ? (
                <Leaf className="w-4 h-4 text-[#10B981]" />
              ) : (
                <Building2 className="w-4 h-4 text-[#14B8A6]" />
              )}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {activeTenant?.name || 'Şirket Seçilmedi'}
              </p>
              {activeTenant?.isOwnerTenant && (
                <span className="text-[10px] text-[#14B8A6] font-medium leading-none">
                  Platform Sahibi
                </span>
              )}
            </div>
          </div>
          {accessibleTenants.length > 1 && (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          )}
        </div>

        {/* Tenant Switching Dropdown (Only for companies the user actually has access to!) */}
        {showTenantDropdown && accessibleTenants.length > 1 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-[#152238] border border-[#273B5B] rounded-lg shadow-2xl py-1 z-50">
            <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isSuperAdmin ? 'Tüm Şirketler (Admin)' : 'Yetkili Olduğunuz Şirketler'}
            </p>
            {accessibleTenants.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  switchTenant(t.id);
                  setShowTenantDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1E2E4A] transition-colors ${
                  t.id === activeTenant?.id ? 'text-[#14B8A6] font-semibold bg-[#0D9488]/10' : 'text-slate-200'
                }`}
              >
                <span className="truncate">{t.name}</span>
                {t.id === activeTenant?.id && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <button
          onClick={() => onSelectTab('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'overview'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400" />
          <span>Genel Bakış</span>
        </button>

        <button
          onClick={() => onSelectTab('search')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'search'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Konu Araştır</span>
        </button>

        <button
          onClick={() => onSelectTab('review_queue')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'review_queue'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>Onay Kuyruğu</span>
          </div>
          {pendingReviewsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#0D9488] text-white">
              {pendingReviewsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('content_detail')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'content_detail'
              ? 'bg-[#152238] text-[#14B8A6] font-semibold border-l-2 border-[#14B8A6] rounded-l-none pl-2.5'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <FileText className={`w-4 h-4 ${currentTab === 'content_detail' ? 'text-[#14B8A6]' : 'text-slate-400'}`} />
          <span>İçerikler</span>
        </button>

        <button
          onClick={() => onSelectTab('brand_profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'brand_profile'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <Bookmark className="w-4 h-4 text-slate-400" />
          <span>Marka Profili</span>
        </button>

        <button
          onClick={() => onSelectTab('scan_settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'scan_settings'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-400" />
          <span>Tarama Ayarları</span>
        </button>

        <button
          onClick={() => onSelectTab('team')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'team'
              ? 'bg-[#152238] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-[#152238]/50'
          }`}
        >
          <Users className="w-4 h-4 text-slate-400" />
          <span>Ekip</span>
        </button>

        {/* Super Admin Special Item */}
        {isSuperAdmin && (
          <div className="pt-2">
            <button
              onClick={() => onSelectTab('super_admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'super_admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Süper Admin Paneli</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded">
                YÖNETİCİ
              </span>
            </button>
          </div>
        )}

        <div className="pt-4 pb-2">
          <div className="border-t border-[#1E293B]" />
        </div>

        {/* Disabled / Coming Soon Features */}
        <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Günlük Bülten</span>
          </div>
          <span className="text-[10px] bg-[#1E293B] text-slate-400 px-1.5 py-0.5 rounded">
            Yakında
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <PenTool className="w-4 h-4 text-slate-500" />
            <span>Yazı Düzenle</span>
          </div>
          <span className="text-[10px] bg-[#1E293B] text-slate-400 px-1.5 py-0.5 rounded">
            Yakında
          </span>
        </div>
      </nav>
    </aside>
  );
}
