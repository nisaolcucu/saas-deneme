'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ContentDetailView } from '@/components/dashboard/ContentDetailView';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { ReviewQueueView } from '@/components/dashboard/ReviewQueueView';
import { ScanSettingsView } from '@/components/dashboard/ScanSettingsView';
import { BrandProfileView } from '@/components/dashboard/BrandProfileView';
import { TopicResearchView } from '@/components/dashboard/TopicResearchView';
import { TeamView } from '@/components/dashboard/TeamView';
import { SuperAdminView } from '@/components/dashboard/SuperAdminView';
import { PendingApprovalView } from '@/components/auth/PendingApprovalView';
import { LoginView } from '@/components/auth/LoginView';

function DashboardApp() {
  const { user, isPendingApplicant, isLoading } = useAuth();
  // Default to content_detail so the screen immediately matches the user's reference screenshot
  const [currentTab, setCurrentTab] = useState<NavTab>('content_detail');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-end gap-1 h-6">
            <span className="w-1.5 h-3 bg-[#14B8A6] rounded-full animate-bounce" />
            <span className="w-1.5 h-6 bg-[#14B8A6] rounded-full animate-bounce delay-100" />
            <span className="w-1.5 h-4 bg-[#14B8A6] rounded-full animate-bounce delay-200" />
          </div>
          <p className="text-xs font-semibold text-slate-500">blogüret yükleniyor...</p>
        </div>
      </div>
    );
  }

  // 1. Pending Applicant Protection: Cannot view company dashboard until approved!
  if (isPendingApplicant) {
    return <PendingApprovalView />;
  }

  // 2. Unauthenticated Screen: Güvenli Giriş Ekranı
  if (!user) {
    return <LoginView />;
  }

  // Breadcrumb mapping
  const breadcrumbLabels: Record<NavTab, string> = {
    overview: 'Genel Bakış / İstatistikler',
    search: 'Kaynak Tarama / Konu Araştır',
    review_queue: 'Onay Kuyruğu / İnceleme',
    content_detail: 'İçerikler / Blog detayı',
    brand_profile: 'Marka Profili / Ayarlar',
    scan_settings: 'Tarama Ayarları / Anahtar Kelimeler',
    team: 'Ekip / Roller',
    super_admin: 'Süper Admin / Platform Yönetimi',
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingReviewsCount={3}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          breadcrumbTitle={breadcrumbLabels[currentTab]}
          onBack={() => setCurrentTab('content_detail')}
          onNavigateTab={setCurrentTab}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'content_detail' && <ContentDetailView />}
            {currentTab === 'overview' && <OverviewView onNavigate={setCurrentTab} />}
            {currentTab === 'search' && <TopicResearchView />}
            {currentTab === 'review_queue' && <ReviewQueueView />}
            {currentTab === 'scan_settings' && <ScanSettingsView />}
            {currentTab === 'brand_profile' && <BrandProfileView />}
            {currentTab === 'team' && <TeamView />}
            {currentTab === 'super_admin' && <SuperAdminView />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
