'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  FileText,
  Users,
  Search,
  LogIn,
  ShieldCheck,
  Eye,
  X,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { Tenant, AccountApplication, Job, AuditLog, UserWithDetails } from '@/types';

export function SuperAdminView() {
  const { user, isSuperAdmin, loginAs } = useAuth();
  const provider = getDataProvider();

  const [activeTab, setActiveTab] = useState<'applications' | 'tenants' | 'users' | 'jobs' | 'audit'>('applications');
  const [applications, setApplications] = useState<AccountApplication[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [usersList, setUsersList] = useState<UserWithDetails[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // User Control Panel Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'tenant_admin' | 'editor' | 'pending'>('all');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserWithDetails | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const apps = await provider.listApplications();
    setApplications(apps);

    const tList = await provider.listTenants();
    setTenants(tList);

    const uList = await provider.listAllUsers();
    setUsersList(uList);

    const jList = await provider.listRecentJobs();
    setJobs(jList);

    const logs = await provider.listAuditLogs();
    setAuditLogs(logs);
  }, [provider]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl max-w-lg mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-red-900">Yetkisiz Erişim</h3>
        <p className="text-xs text-red-700 mt-1">
          Bu alan yalnızca platform seviyesindeki Süper Yöneticilere açıktır.
        </p>
      </div>
    );
  }

  const handleReviewApplication = async (appId: string, action: 'approved' | 'rejected') => {
    if (!user) return;
    try {
      const result = await provider.reviewApplication(appId, action, user.id);
      setNotification(
        action === 'approved'
          ? `Başvuru onaylandı! "${result.tenant?.name}" şirketi oluşturuldu ve kullanıcı yönetici yapıldı.`
          : 'Başvuru reddedildi.'
      );
      setTimeout(() => setNotification(null), 5000);
      await loadAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız.');
    }
  };

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await provider.updateTenantStatus(tenantId, newStatus, user.id);
    setNotification(`Şirket durumu güncellendi: ${newStatus === 'active' ? 'Aktif' : 'Askıda'}`);
    setTimeout(() => setNotification(null), 4000);
    await loadAll();
  };

  const handleImpersonateUser = async (targetUser: UserWithDetails) => {
    setImpersonatingId(targetUser.id);
    try {
      await loginAs(targetUser.id);
      setNotification(`"${targetUser.fullName}" kullanıcısı olarak oturum açıldı.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Oturum açılamadı.');
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleToggleUserStatus = async (targetUser: UserWithDetails) => {
    if (!user) return;
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    await provider.updateUserStatus(targetUser.id, newStatus, user.id);
    setNotification(`${targetUser.fullName} kullanıcısının durumu "${newStatus === 'active' ? 'Aktif' : 'Askıda'}" olarak güncellendi.`);
    setTimeout(() => setNotification(null), 4000);
    await loadAll();
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.memberships.some(m => m.tenantName.toLowerCase().includes(userSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (userRoleFilter === 'admin') return u.isPlatformAdmin;
    if (userRoleFilter === 'tenant_admin') return u.memberships.some(m => m.role === 'tenant_admin');
    if (userRoleFilter === 'editor') return u.memberships.some(m => m.role === 'editor');
    if (userRoleFilter === 'pending') return u.status === 'pending';
    return true;
  });

  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-[#0B132B] text-white p-6 sm:p-8 rounded-2xl border border-amber-900/50 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Platform Yönetim Paneli</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Süper Admin Denetim Merkezi</h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Kayıt başvurularını onaylayın, müşteri şirketlerini ve kullanıcıları yönetin, otomasyon işlerini izleyin ve tüm yönetici denetim loglarını kontrol edin.
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 text-sm">
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Kayıt Başvuruları</span>
          {pendingApps.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              {pendingApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'tenants'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Şirketler ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kullanıcı Kontrol Paneli</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'jobs'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>İş Akışları Monitörü</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Denetim Logları</span>
        </button>
      </div>

      {/* Tab Content 1: Applications */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Yeni Müşteri Kayıt Başvuruları
            </h3>
            <p className="text-xs text-slate-500">
              Onaylanan kullanıcılar için otomatik olarak yeni tenant ve tenant admin hesabı açılır.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {applications.map(app => (
              <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{app.companyName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        app.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {app.status === 'pending' ? 'Beklemede' : app.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Başvuran: <strong>{app.userFullName}</strong> ({app.userEmail}) • {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                  </p>

                  {app.note && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200 max-w-xl">
                      “{app.note}”
                    </p>
                  )}
                </div>

                {app.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewApplication(app.id, 'rejected')}
                      className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reddet</span>
                    </button>

                    <button
                      onClick={() => handleReviewApplication(app.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Şirketi Onayla ve Aç</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Tenants */}
      {activeTab === 'tenants' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Kayıtlı Şirketler (Tenants)</h3>
            <p className="text-xs text-slate-500">
              Platformdaki tüm müşteri şirketleri ve şirketimizin ana hesabı.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {tenants.map(t => (
              <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{t.name}</span>
                    {t.isOwnerTenant && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488]">
                        Platform Sahibi
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t.status === 'active' ? 'Aktif' : 'Askıda'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    ID: {t.id} • Slug: {t.slug}
                  </p>
                </div>

                {!t.isOwnerTenant && (
                  <button
                    onClick={() => handleToggleTenantStatus(t.id, t.status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      t.status === 'active'
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {t.status === 'active' ? 'Askıya Al' : 'Yeniden Aktifleştir'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Users Control Center */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Toplam Kullanıcı
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{usersList.length}</p>
              <span className="text-[11px] text-slate-400">Tüm platform hesapları</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Süper Adminler
              </span>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {usersList.filter(u => u.isPlatformAdmin).length}
              </p>
              <span className="text-[11px] text-amber-600">Tam sistem yetkisi</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                Şirket Kullanıcıları
              </span>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {usersList.filter(u => !u.isPlatformAdmin && u.status !== 'pending').length}
              </p>
              <span className="text-[11px] text-teal-600">Aktif şirket üyeleri</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Bekleyen Başvuru
              </span>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {usersList.filter(u => u.status === 'pending').length}
              </p>
              <span className="text-[11px] text-purple-600">Onay bekleyen adaylar</span>
            </div>
          </div>

          {/* User Control Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kullanıcı Kontrol & Erişim Paneli
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tüm kullanıcıları listeleyin, rollerini ve şirket bağlantılarını inceleyin veya test/destek amaçlı kullanıcı oturumunu taklit edin.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="İsim, e-posta veya şirket ara..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-52"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value as 'all' | 'admin' | 'tenant_admin' | 'editor' | 'pending')}
                    className="text-xs bg-transparent border-none text-slate-700 focus:outline-hidden pr-2 cursor-pointer"
                  >
                    <option value="all">Tüm Roller</option>
                    <option value="admin">Süper Admin</option>
                    <option value="tenant_admin">Şirket Yöneticisi</option>
                    <option value="editor">Editör</option>
                    <option value="pending">Onay Bekleyen</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Kullanıcı</th>
                    <th className="py-3 px-6 font-semibold">Bağlı Şirket(ler)</th>
                    <th className="py-3 px-6 font-semibold">Yetki & Rol</th>
                    <th className="py-3 px-6 font-semibold">Hesap Durumu</th>
                    <th className="py-3 px-6 font-semibold">Kayıt Tarihi</th>
                    <th className="py-3 px-6 font-semibold text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Arama kriterlerine uygun kullanıcı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const isCurrentUser = u.id === user?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* User Info */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                {u.avatarInitials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 leading-tight truncate flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                      Siz
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Companies */}
                          <td className="py-3.5 px-6">
                            {u.isPlatformAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                <span>Tüm Şirketler (Root)</span>
                              </span>
                            ) : u.memberships.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.memberships.map(m => (
                                  <span
                                    key={m.membershipId}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200"
                                  >
                                    {m.tenantName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                {u.application?.companyName ? `${u.application.companyName} (Beklemede)` : 'Şirket Yok'}
                              </span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-6">
                            {u.isPlatformAdmin ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Süper Admin
                              </span>
                            ) : u.status === 'pending' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Başvuru Bekliyor
                              </span>
                            ) : u.memberships.some(m => m.role === 'tenant_admin') ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-[#0F766E] border border-teal-200">
                                Şirket Yöneticisi
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                İçerik Editörü
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-6">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : u.status === 'suspended'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {u.status === 'active' ? '● Aktif' : u.status === 'suspended' ? '● Askıda' : '● Beklemede'}
                            </span>
                          </td>

                          {/* Registered Date */}
                          <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonate Button */}
                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleImpersonateUser(u)}
                                  disabled={impersonatingId === u.id}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                                  title="Bu kullanıcının yetkileriyle oturum aç ve sistemi onun gözünden test et"
                                >
                                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Giriş Yap</span>
                                </button>
                              )}

                              {/* Toggle Status (if not superadmin) */}
                              {!u.isPlatformAdmin && u.status !== 'pending' && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                                    u.status === 'active'
                                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={u.status === 'active' ? 'Kullanıcıyı askıya al' : 'Yeniden aktifleştir'}
                                >
                                  {u.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
                                </button>
                              )}

                              {/* Details Modal */}
                              <button
                                onClick={() => setSelectedUserDetails(u)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Kullanıcı Kartı ve Üyelik Detayları"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Jobs Monitor */}
      {activeTab === 'jobs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Otomasyon İşleri Monitörü</h3>
            <p className="text-xs text-slate-500">
              Tüm şirketler genelinde çalışan ve tamamlanan n8n tarama ve içerik işleri.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.map(j => (
              <div key={j.id} className="p-4 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">{j.id}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{j.tenantId}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Tür: {j.type} • Başlangıç: {new Date(j.createdAt).toLocaleTimeString('tr-TR')}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-semibold ${
                    j.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : j.status === 'running'
                      ? 'bg-blue-100 text-blue-800 animate-pulse'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {j.status === 'completed' ? 'Tamamlandı' : j.status === 'running' ? 'Çalışıyor' : j.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Yönetici Denetim Kayıtları (Audit Log)</h3>
            <p className="text-xs text-slate-500">
              Süper admin ve şirket yöneticilerinin gerçekleştirdiği tüm kritik eylemlerin güvenli kaydı.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map(a => (
              <div key={a.id} className="p-4 flex items-start justify-between hover:bg-slate-50 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{a.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{a.entityType}: {a.entityId}</span>
                  </div>
                  <p className="text-slate-500">
                    İşlemi Yapan: <strong>{a.actorEmail}</strong>
                    {a.tenantId && ` • Şirket: ${a.tenantId}`}
                  </p>
                </div>

                <span className="text-slate-400 font-mono">
                  {new Date(a.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#CCFBF1] text-[#0F766E] font-bold text-base flex items-center justify-center border border-[#99F6E4]">
                  {selectedUserDetails.avatarInitials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedUserDetails.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUserDetails.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kullanıcı ID</span>
                  <span className="font-mono font-medium text-slate-800">{selectedUserDetails.id}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kayıt Tarihi</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedUserDetails.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Bağlı Olduğu Şirketler & Yetkiler
                </span>
                {selectedUserDetails.isPlatformAdmin ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                    👑 Platform Sahibi Süper Admin: Tüm şirketlerin verilerine, ayarlarına ve loglarına tam erişim yetkisi bulunmaktadır.
                  </div>
                ) : selectedUserDetails.memberships.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUserDetails.memberships.map(m => (
                      <div
                        key={m.membershipId}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{m.tenantName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Tenant ID: {m.tenantId}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#0F766E] border border-teal-200">
                          {m.role === 'tenant_admin' ? 'Şirket Yöneticisi' : 'İçerik Editörü'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                    {selectedUserDetails.application ? (
                      <p>
                        Henüz onaylanmamış bir şirket başvurusu bulunmaktadır ({selectedUserDetails.application.companyName}).
                      </p>
                    ) : (
                      <p>Herhangi bir şirkete atanmamış bağımsız hesap.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={async () => {
                  const target = selectedUserDetails;
                  setSelectedUserDetails(null);
                  await handleImpersonateUser(target);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Bu Kullanıcı Olarak Giriş Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
