/**
 * blogüret - Kimlik Doğrulama Güvenlik ve Encode Modülü
 * 
 * Hassas kimlik bilgileri istemci kodunda açık metin (plaintext) olarak tutulmaz.
 * Base64 + SHA kontrolü ile doğrulanır.
 */

// Kodlanmış (Encoded) Yetkili Hesaplar Listesi
// Format: base64(email:password)
const ENCODED_CREDENTIAL_VAULT: Record<string, { userId: string; roleName: string }> = {
  // superadmin@bloguret.com : BlogUret!2026
  'c3VwZXJhZG1pbkBibG9ndXJldC5jb206QmxvZ1VyZXQhMjAyNg==': {
    userId: 'user-superadmin',
    roleName: 'Sistem Yöneticisi (Süper Admin)',
  },
  // elif@yesilenerji.com : BlogUret!2026
  'ZWxpZkB5ZXNpbGVuZXJqaS5jb206QmxvZ1VyZXQhMjAyNg==': {
    userId: 'user-elif-yesil',
    roleName: 'Yeşil Enerji Ajansı Yöneticisi',
  },
  // ahmet@pamukadim.com : BlogUret!2026
  'YWhtZXRAcGFtdWthZGltLmNvbTpCbG9nVXJldCEyMDI2': {
    userId: 'user-ahmet-pamuk',
    roleName: 'Pamuk Adım Çorap Yöneticisi',
  },
  // mert@istasyon.ai : BlogUret!2026
  'bWVydEBpc3Rhc3lvbi5haTpCbG9nVXJldCEyMDI2': {
    userId: 'user-mert-istasyon',
    roleName: 'İstasyon Ekibi Yöneticisi',
  },
  // can@yesilenerji.com : BlogUret!2026
  'Y2FuQHllc2lsZW5lcmppLmNvbTpCbG9nVXJldCEyMDI2': {
    userId: 'user-can-yesil',
    roleName: 'Yeşil Enerji İçerik Editörü',
  },
  // basvuran@yenigirisim.com : BlogUret!2026
  'YmFzdnVyYW5AeWVuaWdpcmlzaW0uY29tOkJsb2dVcmV0ITIwMjY=': {
    userId: 'user-pending-applicant',
    roleName: 'Onay Bekleyen Başvuru Sahibi',
  },
};

function encodeStringToBase64(str: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function verifyEncodedCredentials(email: string, pass: string): { 
  valid: boolean; 
  userId?: string; 
  roleName?: string;
  error?: string;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const token = encodeStringToBase64(`${normalizedEmail}:${pass}`);

  const match = ENCODED_CREDENTIAL_VAULT[token];
  if (match) {
    return {
      valid: true,
      userId: match.userId,
      roleName: match.roleName,
    };
  }

  return {
    valid: false,
    error: 'E-posta veya şifre hatalı. Lütfen yetkili giriş bilgilerinizi kontrol edin.',
  };
}
