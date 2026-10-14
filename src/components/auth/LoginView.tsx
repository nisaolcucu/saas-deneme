'use client';

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LoginView() {
  const { loginWithCredentials } = useAuth();
  // Inputs start completely blank as requested by the user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'E-posta veya şifre hatalı.');
      }
    } catch {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Sistem Yöneticisi (Süper Admin)',
      email: 'superadmin@bloguret.com',
      desc: 'Tüm şirketleri ve başvuruları yönetir',
      badge: 'SÜPER ADMİN',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      role: 'Yeşil Enerji Ajansı (Yönetici)',
      email: 'elif@yesilenerji.com',
      desc: 'Hazır blog yazısı ve kaynakları görüntüler',
      badge: 'ŞİRKET YÖNETİCİSİ',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      role: 'Pamuk Adım Çorap (Yönetici)',
      email: 'ahmet@pamukadim.com',
      desc: 'Tamamen izole ikinci müşteri şirketi',
      badge: 'ŞİRKET YÖNETİCİSİ',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    {
      role: 'Yeni Girişim Ltd. (Başvuru Sahibi)',
      email: 'basvuran@yenigirisim.com',
      desc: 'Onay bekleyen kilitli hesap görünümü',
      badge: 'BEKLEMEDE',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="max-w-md w-full bg-[#152238] border border-[#273B5B] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-3 bg-[#14B8A6] rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-[#14B8A6] rounded-full" />
              <span className="w-1.5 h-4 bg-[#14B8A6] rounded-full" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-sans">blogüret</span>
          </div>
          <h2 className="text-lg font-bold text-white pt-1">Yetkili Yönetim Girişi</h2>
          <p className="text-xs text-slate-400">
            Platform içeriklerini ve şirket panellerini görüntülemek için lütfen kimliğinizi doğrulayın.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/15 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                className="w-full bg-[#0B132B] border border-[#2B3F62] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#14B8A6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Şifrenizi girin..."
                className="w-full bg-[#0B132B] border border-[#2B3F62] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#14B8A6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Doğrulanıyor...' : 'Güvenli Giriş Yap'}</span>
          </button>
        </form>

        {/* Demo Fast Fill for Teammates - Only fills email, password remains protected */}
        <div className="pt-2 border-t border-[#273B5B]/80 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Hesap Seçimi (E-posta Doldurucu)
          </p>

          <div className="space-y-1.5">
            {demoAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  // Password is not revealed or auto-filled
                }}
                className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between text-xs cursor-pointer ${
                  email === acc.email
                    ? 'bg-[#1E2E4A] border-[#14B8A6] text-white shadow-xs'
                    : 'bg-[#0B132B]/60 hover:bg-[#1E2E4A]/80 border-[#223552] text-slate-300'
                }`}
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{acc.role}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${acc.badgeColor}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                </div>

                {email === acc.email ? (
                  <UserCheck className="w-4 h-4 text-[#14B8A6] shrink-0 ml-2" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
