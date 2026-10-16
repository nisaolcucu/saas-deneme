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
  UserWithDetails,
} from '@/types';
import { DataProvider } from './provider-interface';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_MEMBERSHIPS,
  INITIAL_PLATFORM_ADMIN_USER_IDS,
  INITIAL_APPLICATIONS,
  INITIAL_BRAND_PROFILES,
  INITIAL_SCAN_SETTINGS,
  INITIAL_KEYWORDS,
  INITIAL_SOURCES,
  INITIAL_CONTENT_ITEMS,
  INITIAL_CONTENT_VERSIONS,
  INITIAL_REVIEWS,
  INITIAL_JOBS,
  INITIAL_AUDIT_LOGS,
} from './demo-data';

export class DemoDataProvider implements DataProvider {
  private tenants: Tenant[] = [...INITIAL_TENANTS];
  private users: User[] = [...INITIAL_USERS];
  private memberships: TenantMembership[] = [...INITIAL_MEMBERSHIPS];
  private platformAdminUserIds: Set<string> = new Set(INITIAL_PLATFORM_ADMIN_USER_IDS);
  private applications: AccountApplication[] = [...INITIAL_APPLICATIONS];
  private brandProfiles: BrandProfile[] = [...INITIAL_BRAND_PROFILES];
  private scanSettings: ScanSettings[] = [...INITIAL_SCAN_SETTINGS];
  private keywords: Keyword[] = [...INITIAL_KEYWORDS];
  private sources: CandidateSource[] = [...INITIAL_SOURCES];
  private contentItems: ContentItem[] = [...INITIAL_CONTENT_ITEMS];
  private contentVersions: ContentVersion[] = [...INITIAL_CONTENT_VERSIONS];
  private reviews: ReviewItem[] = [...INITIAL_REVIEWS];
  private jobs: Job[] = [...INITIAL_JOBS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('bloguret_demo_state');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.tenants) this.tenants = data.tenants;
        if (data.applications) this.applications = data.applications;
        if (data.brandProfiles) this.brandProfiles = data.brandProfiles;
        if (data.keywords) this.keywords = data.keywords;
        if (data.sources) this.sources = data.sources;
        if (data.contentItems) this.contentItems = data.contentItems;
        if (data.contentVersions) this.contentVersions = data.contentVersions;
        if (data.reviews) {
          this.reviews = data.reviews.map((r: ReviewItem) => {
            const seed = INITIAL_REVIEWS.find(s => s.id === r.id);
            if (seed && seed.metadata.outlineSections && !r.metadata?.outlineSections) {
              return {
                ...r,
                metadata: {
                  ...seed.metadata,
                  ...r.metadata,
                  outlineSections: seed.metadata.outlineSections,
                  targetAudienceSummary: seed.metadata.targetAudienceSummary,
                  coreThesis: seed.metadata.coreThesis,
                  estimatedTotalWords: seed.metadata.estimatedTotalWords,
                },
              };
            }
            return r;
          });
        }
        if (data.jobs) this.jobs = data.jobs;
        if (data.auditLogs) this.auditLogs = data.auditLogs;
      }
    } catch {
      // Ignore parse error, use in-memory seed
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'bloguret_demo_state',
        JSON.stringify({
          tenants: this.tenants,
          applications: this.applications,
          brandProfiles: this.brandProfiles,
          keywords: this.keywords,
          sources: this.sources,
          contentItems: this.contentItems,
          contentVersions: this.contentVersions,
          reviews: this.reviews,
          jobs: this.jobs,
          auditLogs: this.auditLogs,
        })
      );
    } catch {
      // Ignore quota/private mode errors
    }
  }

  // --- Tenancy & Users ---
  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.find(t => t.id === tenantId) || null;
  }

  async listTenants(): Promise<Tenant[]> {
    return [...this.tenants];
  }

  async getUserMemberships(userId: string): Promise<TenantMembership[]> {
    return this.memberships.filter(m => m.userId === userId && m.isActive);
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    return this.platformAdminUserIds.has(userId);
  }

  async getTenantMembers(tenantId: string): Promise<(TenantMembership & { user: User })[]> {
    const mems = this.memberships.filter(m => m.tenantId === tenantId);
    return mems.map(m => {
      const u = this.users.find(user => user.id === m.userId) || {
        id: m.userId,
        email: 'bilinmeyen@kullanici.com',
        fullName: 'Kullanıcı',
        avatarInitials: 'KU',
        createdAt: m.createdAt,
      };
      return { ...m, user: u };
    });
  }

  async updateTenantStatus(tenantId: string, status: 'active' | 'suspended', actorUserId: string): Promise<boolean> {
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (!tenant) return false;
    tenant.status = status;
    tenant.updatedAt = new Date().toISOString();

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: this.users.find(u => u.id === actorUserId)?.email || 'admin@bloguret.com',
      action: status === 'active' ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
      entityType: 'tenant',
      entityId: tenantId,
      details: { newStatus: status },
    });

    this.saveToStorage();
    return true;
  }

  // --- Users & Access Control (Super Admin) ---
  async listAllUsers(): Promise<UserWithDetails[]> {
    return this.users.map(u => {
      const isPlatAdmin = this.platformAdminUserIds.has(u.id);
      const userMems = this.memberships.filter(m => m.userId === u.id);
      const app = this.applications.find(a => a.userId === u.id);

      const membershipsWithTenant = userMems.map(m => {
        const tenant = this.tenants.find(t => t.id === m.tenantId);
        return {
          membershipId: m.id,
          tenantId: m.tenantId,
          tenantName: tenant?.name || 'Bilinmeyen Şirket',
          role: m.role,
          isActive: m.isActive,
        };
      });

      let status: 'active' | 'suspended' | 'pending' = 'active';
      if (app && app.status === 'pending' && userMems.length === 0) {
        status = 'pending';
      } else if (userMems.length > 0 && !userMems.some(m => m.isActive)) {
        status = 'suspended';
      }

      return {
        ...u,
        isPlatformAdmin: isPlatAdmin,
        status,
        memberships: membershipsWithTenant,
        application: app,
      };
    });
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended', actorUserId: string): Promise<boolean> {
    const userMems = this.memberships.filter(m => m.userId === userId);
    userMems.forEach(m => {
      m.isActive = status === 'active';
    });

    await this.createAuditLog({
      actorUserId,
      actorEmail: this.users.find(u => u.id === actorUserId)?.email || 'admin@bloguret.com',
      action: status === 'active' ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      entityType: 'user',
      entityId: userId,
      details: { newStatus: status },
    });

    this.saveToStorage();
    return true;
  }

  // --- Applications ---
  async listApplications(): Promise<AccountApplication[]> {
    return [...this.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getApplicationByUserId(userId: string): Promise<AccountApplication | null> {
    return this.applications.find(a => a.userId === userId) || null;
  }

  async submitApplication(data: {
    userId: string;
    userEmail: string;
    userFullName: string;
    companyName: string;
    note?: string;
  }): Promise<AccountApplication> {
    // Check if user already exists
    let user = this.users.find(u => u.id === data.userId || u.email === data.userEmail);
    if (!user) {
      user = {
        id: data.userId || `user-${Date.now()}`,
        email: data.userEmail,
        fullName: data.userFullName,
        avatarInitials: data.userFullName
          .split(' ')
          .map(p => p[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
    }

    const application: AccountApplication = {
      id: `app-${Date.now()}`,
      userId: user.id,
      userEmail: data.userEmail,
      userFullName: data.userFullName,
      companyName: data.companyName,
      note: data.note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.applications.unshift(application);
    this.saveToStorage();
    return application;
  }

  async reviewApplication(
    applicationId: string,
    action: 'approved' | 'rejected',
    reviewerUserId: string,
    rejectionReason?: string
  ): Promise<{ application: AccountApplication; tenant?: Tenant; membership?: TenantMembership }> {
    const app = this.applications.find(a => a.id === applicationId);
    if (!app) throw new Error('Başvuru bulunamadı.');

    app.status = action;
    app.reviewedBy = reviewerUserId;
    app.reviewedAt = new Date().toISOString();
    if (rejectionReason) app.rejectionReason = rejectionReason;

    let createdTenant: Tenant | undefined;
    let createdMembership: TenantMembership | undefined;

    if (action === 'approved') {
      // 1. Create Tenant
      const slug = app.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const tenantId = `tenant-${Date.now()}`;
      createdTenant = {
        id: tenantId,
        name: app.companyName,
        slug,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.tenants.push(createdTenant);

      // 2. Assign User as Tenant Admin
      createdMembership = {
        id: `mem-${Date.now()}`,
        tenantId,
        userId: app.userId,
        role: 'tenant_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.memberships.push(createdMembership);
      app.assignedTenantId = tenantId;

      // 3. Initialize default scan settings & brand profile draft
      this.scanSettings.push({
        id: `scan-${tenantId}`,
        tenantId,
        scanFrequency: 'daily',
        targetCountPerRun: 5,
        autoSummarize: true,
        minRelevanceScore: 70,
        language: 'tr',
        updatedAt: new Date().toISOString(),
      });

      this.brandProfiles.push({
        id: `bp-${tenantId}-v1`,
        tenantId,
        version: 1,
        status: 'active',
        name: `${app.companyName} Başlangıç Marka Profili v1`,
        targetAudience: 'Sektör profesyonelleri ve müşteriler',
        tone: 'Profesyonel, bilgilendirici ve doğrudan',
        bannedWords: ['mucize', 'bedava'],
        preferredKeywords: [app.companyName.toLowerCase()],
        markdownRaw: `# ${app.companyName} Marka Profili\n\n## Hedef Kitle\nSektör profesyonelleri.`,
        createdAt: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
      });
    }

    await this.createAuditLog({
      actorUserId: reviewerUserId,
      actorEmail: this.users.find(u => u.id === reviewerUserId)?.email || 'admin@bloguret.com',
      action: action === 'approved' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
      entityType: 'account_application',
      entityId: applicationId,
      details: { companyName: app.companyName, result: action },
    });

    this.saveToStorage();
    return { application: app, tenant: createdTenant, membership: createdMembership };
  }

  // --- Brand Profiles ---
  // ---
  async getActiveBrandProfile(tenantId: string): Promise<BrandProfile | null> {
    return this.brandProfiles.find(bp => bp.tenantId === tenantId && bp.status === 'active') || null;
  }

  async listBrandProfiles(tenantId: string): Promise<BrandProfile[]> {
    return this.brandProfiles
      .filter(bp => bp.tenantId === tenantId)
      .sort((a, b) => b.version - a.version);
  }

  async saveBrandProfileDraft(tenantId: string, data: Partial<BrandProfile>): Promise<BrandProfile> {
    const currentActive = await this.getActiveBrandProfile(tenantId);
    const nextVersion = currentActive ? currentActive.version + 1 : 1;

    const draft: BrandProfile = {
      id: `bp-${tenantId}-draft-${Date.now()}`,
      tenantId,
      version: nextVersion,
      status: 'draft',
      name: data.name || `Marka Profili v${nextVersion} (Taslak)`,
      targetAudience: data.targetAudience || 'B2B Karar Vericiler',
      tone: data.tone || 'Profesyonel ve bilgilendirici',
      bannedWords: data.bannedWords || [],
      preferredKeywords: data.preferredKeywords || [],
      markdownRaw: data.markdownRaw || '',
      createdAt: new Date().toISOString(),
    };

    this.brandProfiles.unshift(draft);
    this.saveToStorage();
    return draft;
  }

  async activateBrandProfile(tenantId: string, profileId: string, actorUserId: string): Promise<BrandProfile> {
    const profile = this.brandProfiles.find(bp => bp.id === profileId && bp.tenantId === tenantId);
    if (!profile) throw new Error('Profil bulunamadı.');

    // Archive current active
    this.brandProfiles.forEach(bp => {
      if (bp.tenantId === tenantId && bp.status === 'active') {
        bp.status = 'archived';
      }
    });

    profile.status = 'active';
    profile.activatedAt = new Date().toISOString();

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: this.users.find(u => u.id === actorUserId)?.email || 'editor@bloguret.com',
      action: 'BRAND_PROFILE_ACTIVATED',
      entityType: 'brand_profile',
      entityId: profileId,
      details: { version: profile.version, name: profile.name },
    });

    this.saveToStorage();
    return profile;
  }

  // --- Scan Settings & Keywords ---
  async getScanSettings(tenantId: string): Promise<ScanSettings> {
    let settings = this.scanSettings.find(s => s.tenantId === tenantId);
    if (!settings) {
      settings = {
        id: `scan-${tenantId}`,
        tenantId,
        scanFrequency: 'daily',
        targetCountPerRun: 5,
        autoSummarize: true,
        minRelevanceScore: 70,
        language: 'tr',
        updatedAt: new Date().toISOString(),
      };
      this.scanSettings.push(settings);
    }
    return settings;
  }

  async updateScanSettings(tenantId: string, updates: Partial<ScanSettings>): Promise<ScanSettings> {
    const settings = await this.getScanSettings(tenantId);
    Object.assign(settings, updates, { updatedAt: new Date().toISOString() });
    this.saveToStorage();
    return settings;
  }

  async listKeywords(tenantId: string): Promise<Keyword[]> {
    return this.keywords.filter(k => k.tenantId === tenantId);
  }

  async addKeyword(tenantId: string, keyword: string, category: string): Promise<Keyword> {
    const newKw: Keyword = {
      id: `kw-${tenantId}-${Date.now()}`,
      tenantId,
      keyword: keyword.trim(),
      category: category.trim() || 'Genel',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.keywords.push(newKw);
    this.saveToStorage();
    return newKw;
  }

  async removeKeyword(tenantId: string, keywordId: string): Promise<boolean> {
    const idx = this.keywords.findIndex(k => k.id === keywordId && k.tenantId === tenantId);
    if (idx === -1) return false;
    this.keywords.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  async toggleKeyword(tenantId: string, keywordId: string): Promise<Keyword> {
    const kw = this.keywords.find(k => k.id === keywordId && k.tenantId === tenantId);
    if (!kw) throw new Error('Anahtar kelime bulunamadı.');
    kw.isActive = !kw.isActive;
    this.saveToStorage();
    return kw;
  }

  // --- Candidate Sources ---
  async listSources(tenantId: string, status?: string): Promise<CandidateSource[]> {
    return this.sources.filter(s => s.tenantId === tenantId && (!status || s.status === status));
  }

  async getSource(tenantId: string, sourceId: string): Promise<CandidateSource | null> {
    return this.sources.find(s => s.id === sourceId && s.tenantId === tenantId) || null;
  }

  async reviewSource(
    tenantId: string,
    sourceId: string,
    decision: 'approved' | 'rejected',
    reviewerUserId: string
  ): Promise<CandidateSource> {
    const src = this.sources.find(s => s.id === sourceId && s.tenantId === tenantId);
    if (!src) throw new Error('Kaynak bulunamadı.');

    src.status = decision;
    src.reviewedAt = new Date().toISOString();
    src.reviewedBy = reviewerUserId;

    // Remove or update review queue item
    const revItem = this.reviews.find(r => r.targetId === sourceId && r.tenantId === tenantId);
    if (revItem) {
      revItem.status = decision;
      revItem.reviewedAt = new Date().toISOString();
      revItem.reviewedBy = reviewerUserId;
    }

    this.saveToStorage();
    return src;
  }

  // --- Content Pipeline & Versions ---
  async listContentItems(tenantId: string, status?: string): Promise<ContentItem[]> {
    return this.contentItems.filter(c => c.tenantId === tenantId && (!status || c.status === status));
  }

  async getContentItem(tenantId: string, contentId: string): Promise<ContentItem | null> {
    const item = this.contentItems.find(c => c.id === contentId && c.tenantId === tenantId);
    if (!item) return null;
    const versions = this.contentVersions.filter(v => v.contentItemId === item.id);
    return { ...item, versions };
  }

  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    return this.contentVersions
      .filter(v => v.contentItemId === contentId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async createNewDraftVersion(
    tenantId: string,
    contentId: string,
    actorUserId: string,
    actorName: string
  ): Promise<ContentVersion> {
    const item = this.contentItems.find(c => c.id === contentId && c.tenantId === tenantId);
    if (!item) throw new Error('İçerik bulunamadı.');

    const versions = this.contentVersions.filter(v => v.contentItemId === contentId);
    const lastVersion = versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const newVerNum = (lastVersion ? lastVersion.versionNumber : item.currentVersionNumber) + 1;

    const newVersion: ContentVersion = {
      id: `ver-${contentId}-v${newVerNum}`,
      contentItemId: contentId,
      versionNumber: newVerNum,
      title: item.title,
      bodyMarkdown: lastVersion ? lastVersion.bodyMarkdown : '',
      outline: lastVersion ? [...lastVersion.outline] : ['Giriş', 'Gelişme', 'Sonuç'],
      seoTitle: item.seoTitle,
      metaDescription: item.metaDescription,
      slug: item.slug,
      focusKeyword: item.focusKeyword,
      status: 'draft',
      createdBy: actorUserId,
      createdAt: new Date().toISOString(),
    };

    this.contentVersions.push(newVersion);
    item.currentVersionNumber = newVerNum;
    item.status = 'draft';
    item.updatedAt = new Date().toISOString();

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: actorName,
      action: 'CONTENT_VERSION_DRAFTED',
      entityType: 'content_version',
      entityId: newVersion.id,
      details: { versionNumber: newVerNum, contentTitle: item.title },
    });

    this.saveToStorage();
    return newVersion;
  }

  async updateContentVersion(
    tenantId: string,
    versionId: string,
    updates: Partial<ContentVersion>
  ): Promise<ContentVersion> {
    const ver = this.contentVersions.find(v => v.id === versionId);
    if (!ver) throw new Error('Sürüm bulunamadı.');

    Object.assign(ver, updates);
    const item = this.contentItems.find(c => c.id === ver.contentItemId && c.tenantId === tenantId);
    if (item) {
      if (updates.title) item.title = updates.title;
      if (updates.seoTitle) item.seoTitle = updates.seoTitle;
      if (updates.metaDescription) item.metaDescription = updates.metaDescription;
      if (updates.focusKeyword) item.focusKeyword = updates.focusKeyword;
      item.updatedAt = new Date().toISOString();
    }

    this.saveToStorage();
    return ver;
  }

  // --- Review Queue ---
  async listReviewItems(tenantId: string): Promise<ReviewItem[]> {
    return this.reviews.filter(r => r.tenantId === tenantId && r.status === 'pending');
  }

  async submitReviewDecision(
    tenantId: string,
    reviewItemId: string,
    decision: 'approved' | 'rejected',
    reviewerUserId: string,
    notes?: string
  ): Promise<boolean> {
    const item = this.reviews.find(r => r.id === reviewItemId && r.tenantId === tenantId);
    if (!item) return false;

    item.status = decision;
    item.reviewedBy = reviewerUserId;
    item.reviewedAt = new Date().toISOString();
    item.notes = notes;

    // Progression side effects
    if (item.type === 'source') {
      const src = this.sources.find(s => s.id === item.targetId && s.tenantId === tenantId);
      if (src) {
        src.status = decision;
        src.reviewedBy = reviewerUserId;
        src.reviewedAt = new Date().toISOString();
      }
    } else if (item.type === 'outline' && decision === 'approved') {
      // Moves to final review
      this.reviews.push({
        id: `rev-final-${Date.now()}`,
        tenantId,
        type: 'final',
        targetId: item.targetId,
        targetTitle: `Final Taslak: ${item.targetTitle.replace('Yazı Planı: ', '')}`,
        status: 'pending',
        metadata: {
          draftPreview: 'Onaylanan plan doğrultusunda AI tarafından hazırlanan tam makale taslağı editör onayına sunuldu.',
        },
        createdAt: new Date().toISOString(),
      });
    } else if (item.type === 'final' && decision === 'approved') {
      // Creates or marks ready content item
      const existing = this.contentItems.find(c => c.tenantId === tenantId);
      if (existing) {
        existing.status = 'ready';
        existing.updatedAt = new Date().toISOString();
      }
    }

    this.saveToStorage();
    return true;
  }

  // --- Jobs & Automation ---
  async triggerScanJob(tenantId: string, actorUserId: string): Promise<{ job: Job; alreadyRunning: boolean }> {
    // Check if job already running
    const running = this.jobs.find(j => j.tenantId === tenantId && j.status === 'running' && j.type === 'scan');
    if (running) {
      return { job: running, alreadyRunning: true };
    }

    const tenantKeywords = this.keywords.filter(k => k.tenantId === tenantId && k.isActive);
    const settings = await this.getScanSettings(tenantId);

    const idempotencyKey = `scan-${tenantId}-${new Date().toISOString().slice(0, 13)}`;
    const job: Job = {
      id: `job-scan-${Date.now()}`,
      tenantId,
      type: 'scan',
      status: 'running',
      idempotencyKey,
      payload: {
        keywords: tenantKeywords.map(k => k.keyword),
        targetCount: settings.targetCountPerRun,
        minRelevanceScore: settings.minRelevanceScore,
      },
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };

    this.jobs.unshift(job);
    this.saveToStorage();

    // Simulate completion in demo after brief delay
    setTimeout(() => {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.result = {
        discoveredCount: 2,
        approvedSources: 0,
        message: 'Tarama başarıyla tamamlandı. 2 aday kaynak inceleme kuyruğuna eklendi.',
      };

      // Add a candidate source
      const newCitationKey = `S${this.sources.filter(s => s.tenantId === tenantId).length + 1}`;
      const newSource: CandidateSource = {
        id: `src-${tenantId}-${Date.now()}`,
        tenantId,
        citationKey: newCitationKey,
        title: `Yeni Sektör İncelemesi: ${tenantKeywords[0]?.keyword || 'Teknoloji'} [${newCitationKey}]`,
        url: `https://sektoranaliz.com/rapor/${Date.now()}`,
        snippet: 'Otomasyon süreçlerinin verimlilik üzerindeki etkilerini inceleyen bağımsız araştırma özeti.',
        summary: 'Otomasyon ve Verimlilik Araştırması',
        status: 'pending_review',
        relevanceScore: 86,
        discoveredAt: new Date().toISOString(),
      };
      this.sources.unshift(newSource);

      this.reviews.unshift({
        id: `rev-${Date.now()}`,
        tenantId,
        type: 'source',
        targetId: newSource.id,
        targetTitle: newSource.title,
        status: 'pending',
        metadata: {
          citationKey: newCitationKey,
          sourceUrl: newSource.url,
          sourceSnippet: newSource.snippet,
        },
        createdAt: new Date().toISOString(),
      });

      this.saveToStorage();
    }, 2000);

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: this.users.find(u => u.id === actorUserId)?.email || 'kullanici@bloguret.com',
      action: 'SCAN_JOB_TRIGGERED',
      entityType: 'job',
      entityId: job.id,
      details: { keywordsCount: tenantKeywords.length },
    });

    return { job, alreadyRunning: false };
  }

  async getJob(tenantId: string, jobId: string): Promise<Job | null> {
    return this.jobs.find(j => j.id === jobId && j.tenantId === tenantId) || null;
  }

  async listRecentJobs(tenantId?: string): Promise<Job[]> {
    if (tenantId) {
      return this.jobs.filter(j => j.tenantId === tenantId).slice(0, 10);
    }
    return this.jobs.slice(0, 20);
  }

  // --- Audit Logs ---
  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const entry: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    this.saveToStorage();
    return entry;
  }

  async listAuditLogs(tenantId?: string): Promise<AuditLog[]> {
    if (tenantId) {
      return this.auditLogs.filter(a => a.tenantId === tenantId).slice(0, 50);
    }
    return this.auditLogs.slice(0, 50);
  }
}

export const demoDataProvider = new DemoDataProvider();
