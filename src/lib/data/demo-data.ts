import {
  Tenant,
  User,
  TenantMembership,
  AccountApplication,
  BrandProfile,
  ScanSettings,
  Keyword,
  CandidateSource,
  ContentItem,
  ContentVersion,
  ReviewItem,
  Job,
  AuditLog,
} from '@/types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-superadmin',
    email: 'superadmin@bloguret.com',
    fullName: 'Sistem Yöneticisi',
    avatarInitials: 'SY',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-mert-istasyon',
    email: 'mert@istasyon.ai',
    fullName: 'Mert Aksoy',
    avatarInitials: 'MA',
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'user-elif-yesil',
    email: 'elif@yesilenerji.com',
    fullName: 'Elif Yılmaz',
    avatarInitials: 'EA', // Screenshot avatar
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'user-can-yesil',
    email: 'can@yesilenerji.com',
    fullName: 'Can Demir',
    avatarInitials: 'CD',
    createdAt: '2026-02-02T11:00:00Z',
  },
  {
    id: 'user-ahmet-pamuk',
    email: 'ahmet@pamukadim.com',
    fullName: 'Ahmet Karaca',
    avatarInitials: 'AK',
    createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'user-pending-applicant',
    email: 'basvuran@yenigirisim.com',
    fullName: 'Murat Arslan',
    avatarInitials: 'MA',
    createdAt: '2026-03-01T08:30:00Z',
  },
];

export const INITIAL_PLATFORM_ADMIN_USER_IDS = ['user-superadmin'];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-istasyon',
    name: 'İstasyon Ekibi',
    slug: 'istasyon-ekibi',
    status: 'active',
    isOwnerTenant: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tenant-yesil-enerji',
    name: 'Yeşil Enerji Ajansı',
    slug: 'yesil-enerji-ajansi',
    status: 'active',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'tenant-pamuk-adim',
    name: 'Pamuk Adım Çorap',
    slug: 'pamuk-adim-corap',
    status: 'active',
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
];

export const INITIAL_MEMBERSHIPS: TenantMembership[] = [
  {
    id: 'mem-istasyon-mert',
    tenantId: 'tenant-istasyon',
    userId: 'user-mert-istasyon',
    role: 'tenant_admin',
    isActive: true,
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'mem-yesil-elif',
    tenantId: 'tenant-yesil-enerji',
    userId: 'user-elif-yesil',
    role: 'tenant_admin',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'mem-yesil-can',
    tenantId: 'tenant-yesil-enerji',
    userId: 'user-can-yesil',
    role: 'editor',
    isActive: true,
    createdAt: '2026-02-02T11:00:00Z',
  },
  {
    id: 'mem-pamuk-ahmet',
    tenantId: 'tenant-pamuk-adim',
    userId: 'user-ahmet-pamuk',
    role: 'tenant_admin',
    isActive: true,
    createdAt: '2026-02-10T14:00:00Z',
  },
];

export const INITIAL_APPLICATIONS: AccountApplication[] = [
  {
    id: 'app-pending-01',
    userId: 'user-pending-applicant',
    userEmail: 'basvuran@yenigirisim.com',
    userFullName: 'Murat Arslan',
    companyName: 'Yeni Girişim Bilişim Ltd.',
    note: 'B2B SaaS blog içeriklerimizi otomatikleştirmek istiyoruz. Aylık 8 blog yazısı hedefliyoruz.',
    status: 'pending',
    createdAt: '2026-03-01T08:30:00Z',
  },
  {
    id: 'app-approved-01',
    userId: 'user-elif-yesil',
    userEmail: 'elif@yesilenerji.com',
    userFullName: 'Elif Yılmaz',
    companyName: 'Yeşil Enerji Ajansı',
    note: 'Yenilenebilir enerji sektörü analizleri ve kurumsal blog için başvuru.',
    status: 'approved',
    assignedTenantId: 'tenant-yesil-enerji',
    reviewedBy: 'user-superadmin',
    reviewedAt: '2026-02-01T09:50:00Z',
    createdAt: '2026-01-31T15:00:00Z',
  },
];

export const INITIAL_BRAND_PROFILES: BrandProfile[] = [
  {
    id: 'bp-istasyon-v1',
    tenantId: 'tenant-istasyon',
    version: 1,
    status: 'active',
    name: 'İstasyon Kurumsal ve Teknoloji Profili v1',
    targetAudience: 'SaaS kurucuları, ürün yöneticileri, dijital dönüşüm liderleri',
    tone: 'Öncü, teknik yetkinliği yüksek, yenilikçi ve yalın',
    bannedWords: ['eski usul', 'kolay para', 'sihirli değnek'],
    preferredKeywords: ['otomasyon', 'çok kiracılı mimari', 'yapay zeka iş akışları', 'kalite güvencesi'],
    markdownRaw: '# İstasyon Marka Profili\n\n## Ton & Üslup\nYalın ve teknik.\n\n## Tercih Edilen Terimler\n- otomasyon\n- yapay zeka',
    createdAt: '2026-01-05T10:00:00Z',
    activatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'bp-yesil-v1',
    tenantId: 'tenant-yesil-enerji',
    version: 1,
    status: 'archived',
    name: 'Yeşil Enerji Marka Profili v1',
    targetAudience: 'Temiz enerji meraklıları ve küçük işletmeler',
    tone: 'Eğitici ve genel',
    bannedWords: ['kömür', 'ucuz'],
    preferredKeywords: ['güneş paneli', 'yeşil enerji'],
    markdownRaw: '# Yeşil Enerji Marka Profili v1\n\n## Hedef Kitle\nGenel okuyucu.',
    createdAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'bp-yesil-v2',
    tenantId: 'tenant-yesil-enerji',
    version: 2,
    status: 'active',
    name: 'Yeşil Enerji B2B Sektör Profili v2',
    targetAudience: 'Güneş santrali yatırımcıları, sanayi tesis yöneticileri ve ESG direktörleri',
    tone: 'Veri odaklı, kurumsal, mühendislik derinliğine sahip ve güven verici',
    bannedWords: ['devrim niteliğinde', 'bedava enerji', 'dünyada ilk', 'mucize'],
    preferredKeywords: ['güneş enerjisi verimliliği', 'fotovoltaik sistemler', 'öz tüketim modeli', 'karbon ayak izi'],
    markdownRaw: `# Yeşil Enerji Ajansı Marka Profili (v2)

## Hedef Kitle
- Endüstriyel çatı GES yatırımcıları ve fabrika müdürleri
- Kurumsal sürdürülebilirlik ve finans yöneticileri

## Ton & Üslup
- Tarafsız, analitik, kanıta dayalı ve çözüm odaklı
- Abartılı reklam ifadelerinden kaçınan, sektör raporlarına dayanan dil

## Tercih Edilen Terimler
- güneş enerjisi verimliliği
- lcoe (seviyelendirilmiş elektrik maliyeti)
- amortisman süresi

## Yasaklı Kelimeler
- mucize
- bedava elektrik
- kusursuz
`,
    createdAt: '2026-02-15T11:00:00Z',
    activatedAt: '2026-02-15T11:15:00Z',
  },
  {
    id: 'bp-pamuk-v1',
    tenantId: 'tenant-pamuk-adim',
    version: 1,
    status: 'active',
    name: 'Pamuk Adım Doğal Tekstil Profili v1',
    targetAudience: 'Sağlıklı yaşam tutkunları, sporcular ve konfor arayan tüketiciler',
    tone: 'Sıcak, samimi, insan odaklı, konforu ve cilt sağlığını vurgulayan',
    bannedWords: ['sentetik süper', 'en ucuz', 'tasfiye'],
    preferredKeywords: ['organik pamuk', 'ayak sağlığı', 'dikişsiz burun', 'nefes alabilen kumaş'],
    markdownRaw: `# Pamuk Adım Çorap Marka Rehberi\n\n## Ton & Üslup\nSamimi, konfor ve sağlık odaklı.`,
    createdAt: '2026-02-10T14:30:00Z',
    activatedAt: '2026-02-10T14:35:00Z',
  },
];

export const INITIAL_SCAN_SETTINGS: ScanSettings[] = [
  {
    id: 'scan-istasyon',
    tenantId: 'tenant-istasyon',
    scanFrequency: 'daily',
    targetCountPerRun: 5,
    autoSummarize: true,
    minRelevanceScore: 75,
    language: 'tr',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'scan-yesil',
    tenantId: 'tenant-yesil-enerji',
    scanFrequency: 'daily',
    targetCountPerRun: 5,
    autoSummarize: true,
    minRelevanceScore: 70,
    language: 'tr',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'scan-pamuk',
    tenantId: 'tenant-pamuk-adim',
    scanFrequency: 'weekly',
    targetCountPerRun: 4,
    autoSummarize: true,
    minRelevanceScore: 65,
    language: 'tr',
    updatedAt: '2026-02-10T14:00:00Z',
  },
];

export const INITIAL_KEYWORDS: Keyword[] = [
  // Yeşil Enerji
  {
    id: 'kw-ye-1',
    tenantId: 'tenant-yesil-enerji',
    keyword: 'güneş enerjisi verimliliği',
    category: 'Birincil Odak',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'kw-ye-2',
    tenantId: 'tenant-yesil-enerji',
    keyword: 'endüstriyel çatı GES',
    category: 'Uygulama',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'kw-ye-3',
    tenantId: 'tenant-yesil-enerji',
    keyword: 'fotovoltaik panel teknolojileri',
    category: 'Teknoloji',
    isActive: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
  // Pamuk Adım
  {
    id: 'kw-pa-1',
    tenantId: 'tenant-pamuk-adim',
    keyword: 'organik pamuk çorap',
    category: 'Ürün',
    isActive: true,
    createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'kw-pa-2',
    tenantId: 'tenant-pamuk-adim',
    keyword: 'diyabetik çorap faydaları',
    category: 'Sağlık',
    isActive: true,
    createdAt: '2026-02-10T14:00:00Z',
  },
  // İstasyon Ekibi
  {
    id: 'kw-ie-1',
    tenantId: 'tenant-istasyon',
    keyword: 'yapay zeka içerik iş akışları',
    category: 'Otomasyon',
    isActive: true,
    createdAt: '2026-01-05T10:00:00Z',
  },
];

export const INITIAL_SOURCES: CandidateSource[] = [
  // Yeşil Enerji Ajansı Sources (Screenshot'taki tam kaynaklar)
  {
    id: 'src-ye-1',
    tenantId: 'tenant-yesil-enerji',
    citationKey: 'S1',
    title: 'Örnek sektör raporu [S1]',
    url: 'https://enerjigundemi.org/raporlar/2026-gunes-verimlilik-trendleri',
    snippet: 'Sektör görünümü ve verimlilik trendleri: Yeni nesil hücre kaplamaları sayesinde santral başına yıllık üretim kaybı %0.4 seviyesine indi.',
    summary: 'Sektör görünümü ve verimlilik trendleri',
    status: 'approved',
    relevanceScore: 94,
    discoveredAt: '2026-02-16T08:00:00Z',
    reviewedAt: '2026-02-16T09:30:00Z',
    reviewedBy: 'user-elif-yesil',
  },
  {
    id: 'src-ye-2',
    tenantId: 'tenant-yesil-enerji',
    citationKey: 'S2',
    title: 'Örnek araştırma notu [S2]',
    url: 'https://temizenerji.edu.tr/arastirma/saha-verileri-fotovoltaik',
    snippet: 'Teknolojik yaklaşımlar ve saha verileri: Doğru inverter seçimi ve düzenli bakım yapılan işletmelerde yatırım geri dönüş süresi 3.8 yıla kadar geriliyor.',
    summary: 'Teknolojik yaklaşımlar ve saha verileri',
    status: 'approved',
    relevanceScore: 91,
    discoveredAt: '2026-02-16T08:05:00Z',
    reviewedAt: '2026-02-16T09:32:00Z',
    reviewedBy: 'user-elif-yesil',
  },
  {
    id: 'src-ye-3',
    tenantId: 'tenant-yesil-enerji',
    citationKey: 'S3',
    title: 'Örnek şirket açıklaması [S3]',
    url: 'https://yesilenerji.com/bulten/kurumsal-ges-degerlendirme',
    snippet: 'Uygulama örnekleri ve performans bulguları: 12 farklı üretim tesisinde gerçekleştirilen izleme sonuçları, mikro-çatlak tespit sistemlerinin arıza süresini %40 kısalttığını ortaya koyuyor.',
    summary: 'Uygulama örnekleri ve performans bulguları',
    status: 'approved',
    relevanceScore: 88,
    discoveredAt: '2026-02-16T08:10:00Z',
    reviewedAt: '2026-02-16T09:35:00Z',
    reviewedBy: 'user-elif-yesil',
  },
  // Pending review source for Yeşil Enerji (Kuyrukta beklemede)
  {
    id: 'src-ye-4',
    tenantId: 'tenant-yesil-enerji',
    citationKey: 'S4',
    title: 'Küresel Temiz Enerji Yatırımları 2026 Q1 Bülteni',
    url: 'https://bulten.enerji.org/yatirim-q1-2026',
    snippet: 'Gelişmekte olan piyasalarda yenilenebilir enerjiye aktarılan doğrudan yabancı sermaye bir önceki çeyreğe oranla %18 artış gösterdi.',
    summary: 'Q1 2026 Sektör Sermaye Akışı',
    status: 'pending_review',
    relevanceScore: 82,
    discoveredAt: '2026-02-18T10:00:00Z',
  },
  // Pamuk Adım Çorap Sources (Tamamen izole)
  {
    id: 'src-pa-1',
    tenantId: 'tenant-pamuk-adim',
    citationKey: 'S1',
    title: 'Tekstil Mühendisliği Doğal Lifler Raporu',
    url: 'https://tekstildergisi.com.tr/organik-pamuk-ve-nem-transferi',
    snippet: 'Uzun elyaflı organik pamuk ipliğinin nem tutma kapasitesi sentetik karışımlara göre %35 daha dengeli olup sürtünmeyi minimize eder.',
    summary: 'Doğal Liflerde Cilt Uyum Analizi',
    status: 'approved',
    relevanceScore: 89,
    discoveredAt: '2026-02-12T11:00:00Z',
    reviewedAt: '2026-02-12T13:00:00Z',
    reviewedBy: 'user-ahmet-pamuk',
  },
];

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  // Yeşil Enerji Ajansı - Screenshot'taki "İçerik hazır" Blog Yazısı
  {
    id: 'content-ye-01',
    tenantId: 'tenant-yesil-enerji',
    title: 'Güneş enerjisinde verimliliği artıran yeni yaklaşımlar',
    slug: 'gunes-enerjisinde-verimliligi-artiran-yeni-yaklasimlar',
    status: 'ready', // "İçerik hazır"
    currentVersionNumber: 1,
    brandProfileVersion: 2, // "Marka profili v2"
    authorName: 'Elif',
    category: 'Blog',
    seoTitle: 'Güneş enerjisinde verimliliği artıran yeni yaklaşımlar | Yeşil Enerji Ajansı',
    metaDescription: 'Güneş enerjisinde verimliliği artıran güncel yaklaşımlar, işletmelere sağladığı faydaları ve değerlendirme ölçütlerini ele alıyoruz.',
    focusKeyword: 'güneş enerjisi verimliliği',
    sourceIds: ['src-ye-1', 'src-ye-2', 'src-ye-3'],
    wordCount: 1420,
    createdAt: '2026-02-16T10:00:00Z',
    updatedAt: '2026-02-16T14:30:00Z',
  },
  // Pamuk Adım Çorap İçeriği
  {
    id: 'content-pa-01',
    tenantId: 'tenant-pamuk-adim',
    title: 'Gün Boyu Ayakta Kalanlar İçin Doğru Çorap Seçimi Rehberi',
    slug: 'gun-boyu-ayakta-kalanlar-icin-dogru-corap-secimi',
    status: 'ready',
    currentVersionNumber: 1,
    brandProfileVersion: 1,
    authorName: 'Ahmet',
    category: 'Blog',
    seoTitle: 'Gün Boyu Ayakta Kalanlar İçin Doğru Çorap Seçimi | Pamuk Adım',
    metaDescription: 'İş hayatında ve günlük tempoda ayak konforunu koruyan organik pamuk ve dikişsiz çorap tercihlerine dair kapsamlı rehber.',
    focusKeyword: 'doğru çorap seçimi',
    sourceIds: ['src-pa-1'],
    wordCount: 1150,
    createdAt: '2026-02-13T09:00:00Z',
    updatedAt: '2026-02-13T12:00:00Z',
  },
];

export const INITIAL_CONTENT_VERSIONS: ContentVersion[] = [
  {
    id: 'ver-ye-01-v1',
    contentItemId: 'content-ye-01',
    versionNumber: 1,
    title: 'Güneş enerjisinde verimliliği artıran yeni yaklaşımlar',
    status: 'ready',
    createdBy: 'user-elif-yesil',
    createdAt: '2026-02-16T14:30:00Z',
    seoTitle: 'Güneş enerjisinde verimliliği artıran yeni yaklaşımlar | Yeşil Enerji Ajansı',
    metaDescription: 'Güneş enerjisinde verimliliği artıran güncel yaklaşımlar, işletmelere sağladığı faydaları ve değerlendirme ölçütlerini ele alıyoruz.',
    slug: 'gunes-enerjisinde-verimliligi-artiran-yeni-yaklasimlar',
    focusKeyword: 'güneş enerjisi verimliliği',
    outline: [
      'Giriş: Güneş enerjisinin işletmeler için dönüşümü',
      'Verimlilik neden önemli?',
      'İşletmeler için değerlendirme ölçütleri',
      'Sonuç ve aksiyon adımları',
    ],
    bodyMarkdown: `Güneş enerjisi, temiz ve sürdürülebilir bir gelecek için en önemli kaynaklardan biri olmaya devam ediyor. Son yıllarda hem teknolojik gelişmeler hem de maliyetlerdeki düşüş, güneş enerjisini bireyler ve işletmeler için daha erişilebilir hale getirdi. Ancak asıl odak noktası artık yalnızca kurulu kapasiteyi artırmak değil; mevcut sistemlerden daha yüksek verimlilik elde etmek.

Bu yazıda, güneş enerjisinde verimliliği artıran güncel yaklaşımları, bu yaklaşımların işletmelere sağlayabileceği faydaları ve değerlendirme sürecinde dikkate alınması gereken ölçütleri ele alıyoruz.

## Verimlilik neden önemli?

Güneş enerjisi santrallerinin verimliliği, aynı alandan daha fazla enerji üretmek ve yatırımların geri dönüş süresini kısaltmak açısından kritik bir rol oynar. Daha verimli sistemler, hem ekonomik fayda sağlar hem de çevresel etkiyi azaltarak sürdürülebilirlik hedeflerine katkıda bulunur. [S1]

## İşletmeler için değerlendirme ölçütleri

İşletmeler, güneş enerjisi yatırımlarında teknolojik seçenekleri değerlendirirken panel verimliliği, sistem tasarımı, bakım gereksinimleri ve toplam sahip olma maliyeti gibi ölçütleri dikkate almalıdır. Ayrıca, sahaya özgü analizler ve uzun vadeli performans verileri, doğru teknoloji seçiminde belirleyici olabilir. [S2]

Saha deneyimleri gösteriyor ki, periyodik denetim ve akıllı izleme araçlarıyla desteklenen paneller, işletme ömrü boyunca öngörülen performans eğrisini %98 oranında koruyabilmektedir. [S3]
`,
  },
  {
    id: 'ver-pa-01-v1',
    contentItemId: 'content-pa-01',
    versionNumber: 1,
    title: 'Gün Boyu Ayakta Kalanlar İçin Doğru Çorap Seçimi Rehberi',
    status: 'ready',
    createdBy: 'user-ahmet-pamuk',
    createdAt: '2026-02-13T12:00:00Z',
    seoTitle: 'Gün Boyu Ayakta Kalanlar İçin Doğru Çorap Seçimi | Pamuk Adım',
    metaDescription: 'İş hayatında ve günlük tempoda ayak konforunu koruyan organik pamuk ve dikişsiz çorap tercihlerine dair kapsamlı rehber.',
    slug: 'gun-boyu-ayakta-kalanlar-icin-dogru-corap-secimi',
    focusKeyword: 'doğru çorap seçimi',
    outline: ['Doğal liflerin önemi', 'Dikişsiz burun avantajı', 'Doğru yıkama ve bakım'],
    bodyMarkdown: `Günlük koşuşturmacada en çok yükü ayaklarımız taşır. Doğru kumaş ve dikişsiz tasarım, gün boyu nemi uzaklaştırarak yorgunluğu önler. [S1]`,
  },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-01',
    tenantId: 'tenant-yesil-enerji',
    type: 'source',
    targetId: 'src-ye-4',
    targetTitle: 'Küresel Temiz Enerji Yatırımları 2026 Q1 Bülteni',
    status: 'pending',
    metadata: {
      sourceSnippet: 'Gelişmekte olan piyasalarda yenilenebilir enerjiye aktarılan doğrudan sermaye %18 arttı.',
      sourceUrl: 'https://bulten.enerji.org/yatirim-q1-2026',
      citationKey: 'S4',
    },
    createdAt: '2026-02-18T10:05:00Z',
  },
  {
    id: 'rev-02',
    tenantId: 'tenant-yesil-enerji',
    type: 'outline',
    targetId: 'outline-ye-new',
    targetTitle: 'Yazı Planı: Çatı GES Projelerinde Teşvik ve Finansman Modelleri',
    status: 'pending',
    metadata: {
      targetAudienceSummary: 'Organize Sanayi Bölgesi (OSB) fabrika yöneticileri, CFO\'lar ve kurumsal enerji müdürleri',
      coreThesis: '2026 yılı 5. Bölge teşvik paketi ve sıfır nakit çıkışlı leasing modelleri sayesinde endüstriyel çatı GES yatırımları kendini 3.8 yılda amorti ediyor; doğru finansman modeliyle ilk aydan elektrik gideri kâra dönüştürülebilir.',
      estimatedTotalWords: 1500,
      outlinePoints: [
        '1. Giriş ve 2026 Güncel Teşvik Mevzuatı Kapsamı',
        '2. Öz Sermayesiz Yatırım Modelleri: Leasing ve PPA',
        '3. Yatırımın Geri Dönüş (ROI) ve Amortisman Simülasyonu',
        '4. Şirketler İçin Başvuru Adımları ve Risk Kontrol Listesi',
      ],
      outlineSections: [
        {
          id: 'sec-1',
          heading: '1. Giriş ve 2026 Güncel Teşvik Mevzuatı Kapsamı',
          level: 'h2',
          scopeDescription: '2026 yılı 5. Bölge öncelikli yatırım teşvikleri, KDV muafiyeti ve gümrük vergisi istisnalarının fabrika çatı kurulumlarındaki nakit akışına doğrudan etkisi incelenecektir.',
          keyArguments: [
            '5. Bölge desteklerinde SGK işveren hissesi desteği (%25) ve kurumlar vergisi indirimi oranları.',
            'Lisanssız elektrik üretiminde tüketim fazlası mahsuplaşma (Aylık Mahsuplaşma Tebliği).',
            'Organize Sanayi Bölgeleri (OSB) içi çatı kurulumlarında sağlanan ek emlak ve harç muafiyetleri.',
          ],
          plannedCitations: ['[S1] Resmi Gazete - 2026 Yatırım Teşvik Tebliği', '[S2] EPDK Lisanssız Elektrik Yönetmeliği'],
          estimatedWords: 350,
        },
        {
          id: 'sec-2',
          heading: '2. Öz Sermayesiz Yatırım Modelleri: Leasing ve PPA',
          level: 'h2',
          scopeDescription: 'Finansal kiralama (leasing) ile nakit çıkışı olmadan GES kurulumu ve Enerji Satış Anlaşması (PPA) modellerinin karşılaştırmalı analizi yapılacaktır.',
          keyArguments: [
            'İlk yatırım maliyetini (CAPEX) işletme giderine (OPEX) dönüştürerek şirket bilançosunu ve kredi limitlerini koruma.',
            'ESCO modeli: Sıfır riskli, üretilen elektrik tasarrufu üzerinden paylaşımlı yatırım ortaklığı.',
            'Türk Lirası ve Döviz bazlı leasing faiz oranlarının nakit akış simülasyonu.',
          ],
          plannedCitations: ['[S3] Finansal Kurumlar Birliği 2026 Sektör Raporu'],
          estimatedWords: 450,
        },
        {
          id: 'sec-3',
          heading: '3. Yatırımın Geri Dönüş (ROI) ve Amortisman Simülasyonu',
          level: 'h2',
          scopeDescription: '1 MW kurulu güce sahip örnek bir sanayi tesisi için güncel elektrik tarifeleri, panel verimlilik kayıpları ve bakım giderleri hesaba katılarak reel amortisman tablosu sunulacaktır.',
          keyArguments: [
            'Marmara ve Ege bölgesinde yıllık ortalama 1.450 kWh/kWp üretim potansiyeli simülasyonu.',
            '3.8 yıllık net geri dönüş süresi ve 25 yıllık kümülatif net kâr projeksiyonu.',
            'İnverter yenileme bütçesi (10. yıl) ve periyodik panel yıkama rezerv planlaması.',
          ],
          plannedCitations: ['[S4] Küresel Temiz Enerji Yatırımları 2026 Q1 Bülteni'],
          estimatedWords: 400,
        },
        {
          id: 'sec-4',
          heading: '4. Şirketler İçin Başvuru Adımları ve Risk Kontrol Listesi',
          level: 'h2',
          scopeDescription: 'Çatı statik dayanım testlerinden dağıtım şirketi çağrı mektubu onayına kadar adım adım izlenmesi gereken bürokratik ve teknik süreç rehberleştirilecektir.',
          keyArguments: [
            'Statik proje onayı ve çatı yangın güvenliği sertifikasyonu (İtfaiye uygunluk raporu).',
            'Dağıtım şirketine bağlantı anlaşması (Çağrı Mektubu) başvuru takvimi ve evrak listesi.',
            'TEDAŞ kabulü sonrası sistemin devreye alınması ve SCADA tabanlı uzaktan izleme panelleri.',
          ],
          plannedCitations: ['[S1] Resmi Gazete - 2026 Yatırım Teşvik Tebliği'],
          estimatedWords: 300,
        },
      ],
    },
    createdAt: '2026-02-18T11:00:00Z',
  },
  {
    id: 'rev-03',
    tenantId: 'tenant-yesil-enerji',
    type: 'final',
    targetId: 'draft-ye-final',
    targetTitle: 'Taslak Metin: Sanayi Tesislerinde Enerji Depolama ve Batarya Entegrasyonu',
    status: 'pending',
    metadata: {
      draftPreview: 'Sanayi tesislerinde pik saatlerde enerji maliyetini düşürmek amacıyla lityum-iyon batarya sistemleri giderek daha yaygın hale gelmektedir...',
    },
    createdAt: '2026-02-18T11:30:00Z',
  },
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-ye-01',
    tenantId: 'tenant-yesil-enerji',
    type: 'scan',
    status: 'completed',
    idempotencyKey: 'scan-yesil-enerji-2026-02-16',
    payload: {
      keywords: ['güneş enerjisi verimliliği', 'endüstriyel çatı GES'],
      targetCount: 5,
    },
    result: {
      discoveredCount: 3,
      approvedSources: 3,
    },
    createdAt: '2026-02-16T08:00:00Z',
    startedAt: '2026-02-16T08:00:02Z',
    completedAt: '2026-02-16T08:02:15Z',
  },
  {
    id: 'job-pa-01',
    tenantId: 'tenant-pamuk-adim',
    type: 'scan',
    status: 'completed',
    idempotencyKey: 'scan-pamuk-adim-2026-02-12',
    payload: {
      keywords: ['organik pamuk çorap'],
      targetCount: 4,
    },
    result: {
      discoveredCount: 1,
    },
    createdAt: '2026-02-12T11:00:00Z',
    startedAt: '2026-02-12T11:00:02Z',
    completedAt: '2026-02-12T11:01:40Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-01',
    tenantId: 'tenant-yesil-enerji',
    actorUserId: 'user-elif-yesil',
    actorEmail: 'elif@yesilenerji.com',
    action: 'BRAND_PROFILE_ACTIVATED',
    entityType: 'brand_profile',
    entityId: 'bp-yesil-v2',
    details: { version: 2, name: 'Yeşil Enerji B2B Sektör Profili v2' },
    createdAt: '2026-02-15T11:15:00Z',
  },
  {
    id: 'audit-02',
    tenantId: 'tenant-yesil-enerji',
    actorUserId: 'user-elif-yesil',
    actorEmail: 'elif@yesilenerji.com',
    action: 'CONTENT_PUBLISHED',
    entityType: 'content_item',
    entityId: 'content-ye-01',
    details: { title: 'Güneş enerjisinde verimliliği artıran yeni yaklaşımlar', version: 1 },
    createdAt: '2026-02-16T14:30:00Z',
  },
  {
    id: 'audit-03',
    tenantId: undefined, // Platform level
    actorUserId: 'user-superadmin',
    actorEmail: 'superadmin@bloguret.com',
    action: 'APPLICATION_APPROVED',
    entityType: 'account_application',
    entityId: 'app-approved-01',
    details: { companyName: 'Yeşil Enerji Ajansı', tenantId: 'tenant-yesil-enerji' },
    createdAt: '2026-02-01T09:50:00Z',
  },
];
