'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, User, Mail, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDataProvider } from '@/lib/data';
import { TenantMembership, User as UserType } from '@/types';

export function TeamView() {
  const { activeTenant } = useAuth();
  const provider = getDataProvider();
  const [members, setMembers] = useState<(TenantMembership & { user: UserType })[]>([]);

  const loadMembers = useCallback(async () => {
    if (!activeTenant) return;
    const list = await provider.getTenantMembers(activeTenant.id);
    setMembers(list);
  }, [activeTenant, provider]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ekip ve Roller</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeTenant?.name} şirketine bağlı yetkili kullanıcılar ve erişim seviyeleri.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Şirket Üyeleri ({members.length})</h3>
          </div>
          <span className="text-xs text-slate-400">
            Yeni kullanıcılar Süper Admin onayıyla şirkete atanır.
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map(m => (
            <div key={m.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#CCFBF1] text-[#0F766E] font-bold flex items-center justify-center text-sm border border-[#99F6E4]">
                  {m.user.avatarInitials || 'KU'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{m.user.fullName}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {m.user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Kayıt: {new Date(m.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    m.role === 'tenant_admin'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.role === 'tenant_admin' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Şirket Yöneticisi</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Editör</span>
                    </>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Aktif</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
