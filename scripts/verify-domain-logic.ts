/**
 * blogüret - Domain ve Multi-Tenancy İş Mantığı Doğrulama Testi
 * 
 * Çalıştırma: npx tsx scripts/verify-domain-logic.ts
 */

import { DemoDataProvider } from '../src/lib/data/demo-provider';
import { parseBrandProfileMarkdown } from '../src/lib/brand-profile/parser';
import { N8nScanTriggerPayloadSchema } from '../src/lib/n8n/contract';

async function runVerification() {
  console.log('======================================================');
  console.log('🧪 blogüret: İş Mantığı ve Multi-Tenancy Doğrulama Testi');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [BAŞARILI] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [BAŞARISIZ] ${testName}`);
      if (details) console.error(`     Detay: ${details}`);
      process.exitCode = 1;
    }
  }

  const provider = new DemoDataProvider();

  // -------------------------------------------------------------------------
  // TEST 1: Şirket Ayrımı (Tenant Isolation)
  // -------------------------------------------------------------------------
  console.log('\n[1] Şirket Ayrımı (Tenant Isolation) Testi:');
  const yesilSources = await provider.listSources('tenant-yesil-enerji');
  const pamukSources = await provider.listSources('tenant-pamuk-adim');

  const hasOverlap = yesilSources.some(ys => pamukSources.some(ps => ps.id === ys.id));
  assert(!hasOverlap, 'Yeşil Enerji ve Pamuk Adım kaynak havuzları tamamen izoledir.');

  const yesilKeywords = await provider.listKeywords('tenant-yesil-enerji');
  const pamukKeywords = await provider.listKeywords('tenant-pamuk-adim');
  const keywordOverlap = yesilKeywords.some(yk => pamukKeywords.some(pk => pk.id === yk.id));
  assert(!keywordOverlap, 'Şirketlerin anahtar kelime listeleri birbirinden ayrı tutulmaktadır.');

  // -------------------------------------------------------------------------
  // TEST 2: Bekleyen Hesap Koruması (Pending Applicant Lockdown)
  // -------------------------------------------------------------------------
  console.log('\n[2] Bekleyen Hesap Koruması (Pending Applicant) Testi:');
  const pendingUserMemberships = await provider.getUserMemberships('user-pending-applicant');
  assert(
    pendingUserMemberships.length === 0,
    'Onay bekleyen kullanıcının hiçbir aktif şirket üyeliği (tenant membership) bulunmamaktadır.'
  );

  const pendingApp = await provider.getApplicationByUserId('user-pending-applicant');
  assert(
    pendingApp?.status === 'pending',
    'Başvuru durumu "pending" (beklemede) olarak doğrulanmıştır.'
  );

  // -------------------------------------------------------------------------
  // TEST 3: Süper Admin Onayı ile Şirket Oluşumu ve Bağlantı
  // -------------------------------------------------------------------------
  console.log('\n[3] Süper Admin Onay Akışı Testi:');
  const initialTenantCount = (await provider.listTenants()).length;
  const newApp = await provider.submitApplication({
    userId: 'user-test-applicant',
    userEmail: 'kurucu@yenico.com',
    userFullName: 'Kemal Test',
    companyName: 'Yeni Nesil Mobil A.Ş.',
    note: 'Test başvurusu',
  });

  const reviewResult = await provider.reviewApplication(
    newApp.id,
    'approved',
    'user-superadmin'
  );

  const updatedTenantCount = (await provider.listTenants()).length;
  assert(
    updatedTenantCount === initialTenantCount + 1,
    'Onay işlemi sonrası yeni şirket (tenant) başarıyla oluşturuldu.'
  );
  assert(
    reviewResult.membership?.role === 'tenant_admin',
    'İlk onaylanan kullanıcı şirket yöneticisi (tenant_admin) olarak atandı.'
  );

  // -------------------------------------------------------------------------
  // TEST 4: Çift Tetikleme ve Idempotency Testi
  // -------------------------------------------------------------------------
  console.log('\n[4] Çift Tetikleme ve Idempotency Testi:');
  const _run1 = await provider.triggerScanJob('tenant-yesil-enerji', 'user-elif-yesil');
  const run2 = await provider.triggerScanJob('tenant-yesil-enerji', 'user-elif-yesil');

  assert(
    run2.alreadyRunning === true,
    'Aynı şirket için devam eden tarama varken ikinci tetikleme engellendi (idempotent koruma).'
  );

  // -------------------------------------------------------------------------
  // TEST 5: Marka Profili Güvenlik ve Deterministik Ayrıştırma
  // -------------------------------------------------------------------------
  console.log('\n[5] Marka Profili Deterministik Parser ve Güvenlik Testi:');
  const maliciousMd = '# Tehlikeli Başlık\n<script>alert("hacked")</script>\n## Ton\nAgresif';
  const maliciousResult = parseBrandProfileMarkdown(maliciousMd);
  assert(
    maliciousResult.success === false,
    'Zararlı <script> etiketleri içeren markdown güvenli şekilde reddedildi.'
  );

  const validMd = `# Test Şirketi\n\n## Hedef Kitle\nB2B Yöneticiler\n\n## Ton & Üslup\nKurumsal ve yalın\n\n## Yasaklı Kelimeler\n- mucize\n- bedava`;
  const validResult = parseBrandProfileMarkdown(validMd);
  assert(
    validResult.success === true && validResult.data?.bannedWords.includes('mucize') === true,
    'Geçerli markdown alanları (Hedef Kitle, Ton, Yasaklı Kelimeler) deterministik olarak ayrıştırıldı.'
  );

  const draft = await provider.saveBrandProfileDraft('tenant-yesil-enerji', {
    markdownRaw: validMd,
    name: 'Önizleme Profili',
    bannedWords: validResult.data?.bannedWords,
  });
  assert(
    draft.status === 'draft',
    'Yüklenen yeni marka profili doğrudan aktif edilmedi; "draft" (taslak) statüsünde oluşturuldu.'
  );

  // -------------------------------------------------------------------------
  // TEST 6: n8n Veri Kontratı Doğrulaması (Zod)
  // -------------------------------------------------------------------------
  console.log('\n[6] n8n Zod Veri Kontratı Testi:');
  const validN8nPayload = {
    tenantId: 'tenant-yesil-enerji',
    tenantName: 'Yeşil Enerji Ajansı',
    jobId: 'job-1234',
    idempotencyKey: 'idemp-1234',
    keywords: ['güneş enerjisi verimliliği'],
    targetCount: 5,
    minRelevanceScore: 75,
    language: 'tr',
    brandProfile: {
      name: 'Yeşil Enerji Ajansı',
      tone: 'Profesyonel',
      targetAudience: 'B2B Yöneticiler',
      preferredKeywords: ['verimlilik'],
      bannedWords: ['mucize'],
    },
    callbackUrl: 'http://localhost:3000/api/n8n/callback',
  };

  const zodValidation = N8nScanTriggerPayloadSchema.safeParse(validN8nPayload);
  assert(
    zodValidation.success === true,
    'Ortak n8n iş yükü Zod kontratına tam uygunluk gösterdi.'
  );

  // -------------------------------------------------------------------------
  // SONUÇ ÖZETİ
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------');
  console.log(`Sonuç: ${passedTests} / ${totalTests} test başarıyla tamamlandı.`);
  console.log('------------------------------------------------------\n');

  if (process.env.NEXT_PUBLIC_APP_MODE !== 'live') {
    console.log('ℹ️  Not: Bu testler DemoDataProvider üzerinde yerel olarak çalıştırılmıştır.');
    console.log('   Canlı Supabase bağlantısı ortam değişkenleri sağlandığında RLS testleri Supabase üzerinde çalıştırılabilir.');
  }
}

runVerification().catch(err => {
  console.error('Test çalıştırma hatası:', err);
  process.exit(1);
});
