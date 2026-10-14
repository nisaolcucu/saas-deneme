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
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseDataProvider implements DataProvider {
  private client: SupabaseClient | null = null;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      this.client = createClient(url, anonKey);
    }
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        'Supabase istemcisi yapılandırılmamış. Lütfen NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değişkenlerini tanımlayın.'
      );
    }
    return this.client;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    return data || null;
  }

  async listTenants(): Promise<Tenant[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('tenants').select('*');
    return data || [];
  }

  async getUserMemberships(userId: string): Promise<TenantMembership[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('tenant_memberships').select('*').eq('user_id', userId).eq('is_active', true);
    return (data || []).map(m => ({
      id: m.id,
      tenantId: m.tenant_id,
      userId: m.user_id,
      role: m.role,
      isActive: m.is_active,
      createdAt: m.created_at,
    }));
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('platform_admins').select('id').eq('user_id', userId).maybeSingle();
    return !!data;
  }

  async getTenantMembers(tenantId: string): Promise<(TenantMembership & { user: User })[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase
      .from('tenant_memberships')
      .select('*, users(*)')
      .eq('tenant_id', tenantId);

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      user: {
        id: row.users?.id || row.user_id,
        email: row.users?.email || '',
        fullName: row.users?.full_name || 'Kullanıcı',
        avatarInitials: (row.users?.full_name || 'KU').slice(0, 2).toUpperCase(),
        createdAt: row.users?.created_at || row.created_at,
      },
    }));
  }

  async updateTenantStatus(tenantId: string, status: 'active' | 'suspended', actorUserId: string): Promise<boolean> {
    const supabase = this.ensureClient();
    const { error } = await supabase.from('tenants').update({ status, updated_at: new Date().toISOString() }).eq('id', tenantId);
    if (!error) {
      await this.createAuditLog({
        tenantId,
        actorUserId,
        actorEmail: 'admin@bloguret.com',
        action: `TENANT_${status.toUpperCase()}`,
        entityType: 'tenant',
        entityId: tenantId,
      });
      return true;
    }
    return false;
  }

  async listAllUsers(): Promise<UserWithDetails[]> {
    const supabase = this.ensureClient();
    const { data: users } = await supabase.from('users').select('*');
    const { data: memberships } = await supabase.from('tenant_memberships').select('*, tenants(name)');
    const { data: platformAdmins } = await supabase.from('platform_admins').select('user_id');
    const adminSet = new Set((platformAdmins || []).map(p => p.user_id));

    return (users || []).map(u => {
      const isPlatAdmin = adminSet.has(u.id);
      const userMems = (memberships || [])
        .filter(m => m.user_id === u.id)
        .map(m => ({
          membershipId: m.id,
          tenantId: m.tenant_id,
          tenantName: m.tenants?.name || 'Şirket',
          role: m.role,
          isActive: m.is_active,
        }));

      return {
        id: u.id,
        email: u.email,
        fullName: u.full_name || u.email,
        avatarInitials: u.avatar_initials || 'KU',
        createdAt: u.created_at,
        isPlatformAdmin: isPlatAdmin,
        status: userMems.length > 0 && !userMems.some(m => m.isActive) ? 'suspended' : 'active',
        memberships: userMems,
      };
    });
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended', _actorUserId: string): Promise<boolean> {
    const supabase = this.ensureClient();
    await supabase.from('tenant_memberships').update({ is_active: status === 'active' }).eq('user_id', userId);
    return true;
  }

  async listApplications(): Promise<AccountApplication[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('account_applications').select('*').order('created_at', { ascending: false });
    return (data || []).map(a => ({
      id: a.id,
      userId: a.user_id,
      userEmail: a.user_email,
      userFullName: a.user_full_name,
      companyName: a.company_name,
      note: a.note,
      status: a.status,
      assignedTenantId: a.assigned_tenant_id,
      reviewedBy: a.reviewed_by,
      reviewedAt: a.reviewed_at,
      rejectionReason: a.rejection_reason,
      createdAt: a.created_at,
    }));
  }

  async getApplicationByUserId(userId: string): Promise<AccountApplication | null> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('account_applications').select('*').eq('user_id', userId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      userEmail: data.user_email,
      userFullName: data.user_full_name,
      companyName: data.company_name,
      note: data.note,
      status: data.status,
      assignedTenantId: data.assigned_tenant_id,
      createdAt: data.created_at,
    };
  }

  async submitApplication(data: {
    userId: string;
    userEmail: string;
    userFullName: string;
    companyName: string;
    note?: string;
  }): Promise<AccountApplication> {
    const supabase = this.ensureClient();
    const payload = {
      user_id: data.userId,
      user_email: data.userEmail,
      user_full_name: data.userFullName,
      company_name: data.companyName,
      note: data.note,
      status: 'pending',
    };
    const { data: created, error } = await supabase.from('account_applications').insert(payload).select().single();
    if (error || !created) throw new Error(error?.message || 'Başvuru gönderilemedi.');
    return {
      id: created.id,
      userId: created.user_id,
      userEmail: created.user_email,
      userFullName: created.user_full_name,
      companyName: created.company_name,
      note: created.note,
      status: created.status,
      createdAt: created.created_at,
    };
  }

  async reviewApplication(
    applicationId: string,
    action: 'approved' | 'rejected',
    reviewerUserId: string,
    rejectionReason?: string
  ): Promise<{ application: AccountApplication; tenant?: Tenant; membership?: TenantMembership }> {
    const supabase = this.ensureClient();
    const { data: app, error } = await supabase
      .from('account_applications')
      .update({
        status: action,
        reviewed_by: reviewerUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error || !app) throw new Error(error?.message || 'Başvuru güncellenemedi.');

    let tenant: Tenant | undefined;
    let membership: TenantMembership | undefined;

    if (action === 'approved') {
      const slug = app.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: newTenant } = await supabase
        .from('tenants')
        .insert({ name: app.company_name, slug, status: 'active' })
        .select()
        .single();

      if (newTenant) {
        tenant = newTenant;
        const { data: newMem } = await supabase
          .from('tenant_memberships')
          .insert({ tenant_id: newTenant.id, user_id: app.user_id, role: 'tenant_admin', is_active: true })
          .select()
          .single();
        if (newMem) {
          membership = {
            id: newMem.id,
            tenantId: newMem.tenant_id,
            userId: newMem.user_id,
            role: newMem.role,
            isActive: newMem.is_active,
            createdAt: newMem.created_at,
          };
        }
      }
    }

    return {
      application: {
        id: app.id,
        userId: app.user_id,
        userEmail: app.user_email,
        userFullName: app.user_full_name,
        companyName: app.company_name,
        status: app.status,
        createdAt: app.created_at,
      },
      tenant,
      membership,
    };
  }

  async getActiveBrandProfile(tenantId: string): Promise<BrandProfile | null> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('brand_profiles').select('*').eq('tenant_id', tenantId).eq('status', 'active').maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      version: data.version,
      status: data.status,
      name: data.name,
      targetAudience: data.target_audience,
      tone: data.tone,
      bannedWords: data.banned_words || [],
      preferredKeywords: data.preferred_keywords || [],
      markdownRaw: data.markdown_raw || '',
      createdAt: data.created_at,
      activatedAt: data.activated_at,
    };
  }

  async listBrandProfiles(tenantId: string): Promise<BrandProfile[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('brand_profiles').select('*').eq('tenant_id', tenantId).order('version', { ascending: false });
    return (data || []).map(d => ({
      id: d.id,
      tenantId: d.tenant_id,
      version: d.version,
      status: d.status,
      name: d.name,
      targetAudience: d.target_audience,
      tone: d.tone,
      bannedWords: d.banned_words || [],
      preferredKeywords: d.preferred_keywords || [],
      markdownRaw: d.markdown_raw || '',
      createdAt: d.created_at,
      activatedAt: d.activated_at,
    }));
  }

  async saveBrandProfileDraft(tenantId: string, data: Partial<BrandProfile>): Promise<BrandProfile> {
    const supabase = this.ensureClient();
    const active = await this.getActiveBrandProfile(tenantId);
    const nextVer = (active?.version || 0) + 1;
    const payload = {
      tenant_id: tenantId,
      version: nextVer,
      status: 'draft',
      name: data.name || `Marka Profili v${nextVer}`,
      target_audience: data.targetAudience,
      tone: data.tone,
      banned_words: data.bannedWords,
      preferred_keywords: data.preferredKeywords,
      markdown_raw: data.markdownRaw,
    };
    const { data: created, error } = await supabase.from('brand_profiles').insert(payload).select().single();
    if (error || !created) throw new Error(error?.message || 'Taslak kaydedilemedi.');
    return {
      id: created.id,
      tenantId: created.tenant_id,
      version: created.version,
      status: created.status,
      name: created.name,
      targetAudience: created.target_audience,
      tone: created.tone,
      bannedWords: created.banned_words || [],
      preferredKeywords: created.preferred_keywords || [],
      markdownRaw: created.markdown_raw || '',
      createdAt: created.created_at,
    };
  }

  async activateBrandProfile(tenantId: string, profileId: string, actorUserId: string): Promise<BrandProfile> {
    const supabase = this.ensureClient();
    await supabase.from('brand_profiles').update({ status: 'archived' }).eq('tenant_id', tenantId).eq('status', 'active');
    const { data: updated, error } = await supabase
      .from('brand_profiles')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', profileId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !updated) throw new Error(error?.message || 'Profil etkinleştirilemedi.');

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: 'user@bloguret.com',
      action: 'BRAND_PROFILE_ACTIVATED',
      entityType: 'brand_profile',
      entityId: profileId,
    });

    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      version: updated.version,
      status: updated.status,
      name: updated.name,
      targetAudience: updated.target_audience,
      tone: updated.tone,
      bannedWords: updated.banned_words || [],
      preferredKeywords: updated.preferred_keywords || [],
      markdownRaw: updated.markdown_raw || '',
      createdAt: updated.created_at,
      activatedAt: updated.activated_at,
    };
  }

  async getScanSettings(tenantId: string): Promise<ScanSettings> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('scan_settings').select('*').eq('tenant_id', tenantId).maybeSingle();
    if (data) {
      return {
        id: data.id,
        tenantId: data.tenant_id,
        scanFrequency: data.scan_frequency,
        targetCountPerRun: data.target_count_per_run,
        autoSummarize: data.auto_summarize,
        minRelevanceScore: data.min_relevance_score,
        language: data.language,
        updatedAt: data.updated_at,
      };
    }
    return {
      id: `scan-${tenantId}`,
      tenantId,
      scanFrequency: 'daily',
      targetCountPerRun: 5,
      autoSummarize: true,
      minRelevanceScore: 70,
      language: 'tr',
      updatedAt: new Date().toISOString(),
    };
  }

  async updateScanSettings(tenantId: string, settings: Partial<ScanSettings>): Promise<ScanSettings> {
    const supabase = this.ensureClient();
    const { data, error } = await supabase
      .from('scan_settings')
      .upsert({
        tenant_id: tenantId,
        scan_frequency: settings.scanFrequency,
        target_count_per_run: settings.targetCountPerRun,
        auto_summarize: settings.autoSummarize,
        min_relevance_score: settings.minRelevanceScore,
        language: settings.language,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Tarama ayarları güncellenemedi.');
    return {
      id: data.id,
      tenantId: data.tenant_id,
      scanFrequency: data.scan_frequency,
      targetCountPerRun: data.target_count_per_run,
      autoSummarize: data.auto_summarize,
      minRelevanceScore: data.min_relevance_score,
      language: data.language,
      updatedAt: data.updated_at,
    };
  }

  async listKeywords(tenantId: string): Promise<Keyword[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('keywords').select('*').eq('tenant_id', tenantId);
    return (data || []).map(k => ({
      id: k.id,
      tenantId: k.tenant_id,
      keyword: k.keyword,
      category: k.category,
      isActive: k.is_active,
      createdAt: k.created_at,
    }));
  }

  async addKeyword(tenantId: string, keyword: string, category: string): Promise<Keyword> {
    const supabase = this.ensureClient();
    const { data, error } = await supabase
      .from('keywords')
      .insert({ tenant_id: tenantId, keyword: keyword.trim(), category: category.trim() || 'Genel', is_active: true })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Anahtar kelime eklenemedi.');
    return {
      id: data.id,
      tenantId: data.tenant_id,
      keyword: data.keyword,
      category: data.category,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async removeKeyword(tenantId: string, keywordId: string): Promise<boolean> {
    const supabase = this.ensureClient();
    const { error } = await supabase.from('keywords').delete().eq('id', keywordId).eq('tenant_id', tenantId);
    return !error;
  }

  async toggleKeyword(tenantId: string, keywordId: string): Promise<Keyword> {
    const supabase = this.ensureClient();
    const { data: cur } = await supabase.from('keywords').select('is_active').eq('id', keywordId).single();
    const { data, error } = await supabase
      .from('keywords')
      .update({ is_active: !cur?.is_active })
      .eq('id', keywordId)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Kelime durumu güncellenemedi.');
    return {
      id: data.id,
      tenantId: data.tenant_id,
      keyword: data.keyword,
      category: data.category,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async listSources(tenantId: string, status?: string): Promise<CandidateSource[]> {
    const supabase = this.ensureClient();
    let q = supabase.from('sources').select('*').eq('tenant_id', tenantId);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    return (data || []).map(s => ({
      id: s.id,
      tenantId: s.tenant_id,
      title: s.title,
      url: s.url,
      snippet: s.snippet,
      citationKey: s.citation_key,
      status: s.status,
      relevanceScore: s.relevance_score,
      discoveredAt: s.discovered_at,
      reviewedAt: s.reviewed_at,
      reviewedBy: s.reviewed_by,
      summary: s.summary,
    }));
  }

  async getSource(tenantId: string, sourceId: string): Promise<CandidateSource | null> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('sources').select('*').eq('id', sourceId).eq('tenant_id', tenantId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      title: data.title,
      url: data.url,
      snippet: data.snippet,
      citationKey: data.citation_key,
      status: data.status,
      relevanceScore: data.relevance_score,
      discoveredAt: data.discovered_at,
    };
  }

  async reviewSource(
    tenantId: string,
    sourceId: string,
    decision: 'approved' | 'rejected',
    reviewerUserId: string
  ): Promise<CandidateSource> {
    const supabase = this.ensureClient();
    const { data, error } = await supabase
      .from('sources')
      .update({ status: decision, reviewed_by: reviewerUserId, reviewed_at: new Date().toISOString() })
      .eq('id', sourceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Kaynak incelenemedi.');
    return {
      id: data.id,
      tenantId: data.tenant_id,
      title: data.title,
      url: data.url,
      snippet: data.snippet,
      citationKey: data.citation_key,
      status: data.status,
      relevanceScore: data.relevance_score,
      discoveredAt: data.discovered_at,
    };
  }

  async listContentItems(tenantId: string, status?: string): Promise<ContentItem[]> {
    const supabase = this.ensureClient();
    let q = supabase.from('content_items').select('*').eq('tenant_id', tenantId);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    return (data || []).map(c => ({
      id: c.id,
      tenantId: c.tenant_id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      currentVersionNumber: c.current_version_number,
      brandProfileVersion: c.brand_profile_version,
      authorName: c.author_name || 'Editör',
      category: c.category || 'Blog',
      seoTitle: c.seo_title,
      metaDescription: c.meta_description,
      focusKeyword: c.focus_keyword,
      sourceIds: c.source_ids || [],
      wordCount: c.word_count || 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  async getContentItem(tenantId: string, contentId: string): Promise<ContentItem | null> {
    const supabase = this.ensureClient();
    const { data: item } = await supabase.from('content_items').select('*').eq('id', contentId).eq('tenant_id', tenantId).maybeSingle();
    if (!item) return null;
    const { data: vers } = await supabase.from('content_versions').select('*').eq('content_item_id', contentId);
    return {
      id: item.id,
      tenantId: item.tenant_id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      currentVersionNumber: item.current_version_number,
      brandProfileVersion: item.brand_profile_version,
      authorName: item.author_name || 'Editör',
      category: item.category || 'Blog',
      seoTitle: item.seo_title,
      metaDescription: item.meta_description,
      focusKeyword: item.focus_keyword,
      sourceIds: item.source_ids || [],
      wordCount: item.word_count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      versions: (vers || []).map(v => ({
        id: v.id,
        contentItemId: v.content_item_id,
        versionNumber: v.version_number,
        title: v.title,
        bodyMarkdown: v.body_markdown,
        outline: v.outline || [],
        seoTitle: v.seo_title,
        metaDescription: v.meta_description,
        slug: v.slug,
        focusKeyword: v.focus_keyword,
        status: v.status,
        createdBy: v.created_by,
        createdAt: v.created_at,
      })),
    };
  }

  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('content_versions').select('*').eq('content_item_id', contentId).order('version_number', { ascending: false });
    return (data || []).map(v => ({
      id: v.id,
      contentItemId: v.content_item_id,
      versionNumber: v.version_number,
      title: v.title,
      bodyMarkdown: v.body_markdown,
      outline: v.outline || [],
      seoTitle: v.seo_title,
      metaDescription: v.meta_description,
      slug: v.slug,
      focusKeyword: v.focus_keyword,
      status: v.status,
      createdBy: v.created_by,
      createdAt: v.created_at,
    }));
  }

  async createNewDraftVersion(
    tenantId: string,
    contentId: string,
    actorUserId: string,
    actorName: string
  ): Promise<ContentVersion> {
    const item = await this.getContentItem(tenantId, contentId);
    if (!item) throw new Error('İçerik bulunamadı.');

    const newVerNum = item.currentVersionNumber + 1;
    const supabase = this.ensureClient();
    const { data: ver, error } = await supabase
      .from('content_versions')
      .insert({
        content_item_id: contentId,
        version_number: newVerNum,
        title: item.title,
        body_markdown: item.versions?.[0]?.bodyMarkdown || '',
        outline: item.versions?.[0]?.outline || [],
        seo_title: item.seoTitle,
        meta_description: item.metaDescription,
        slug: item.slug,
        focus_keyword: item.focusKeyword,
        status: 'draft',
        created_by: actorUserId,
      })
      .select()
      .single();

    if (error || !ver) throw new Error(error?.message || 'Taslak oluşturulamadı.');

    await supabase.from('content_items').update({ current_version_number: newVerNum, status: 'draft' }).eq('id', contentId);

    await this.createAuditLog({
      tenantId,
      actorUserId,
      actorEmail: actorName,
      action: 'CONTENT_VERSION_DRAFTED',
      entityType: 'content_version',
      entityId: ver.id,
    });

    return {
      id: ver.id,
      contentItemId: ver.content_item_id,
      versionNumber: ver.version_number,
      title: ver.title,
      bodyMarkdown: ver.body_markdown,
      outline: ver.outline || [],
      seoTitle: ver.seo_title,
      metaDescription: ver.meta_description,
      slug: ver.slug,
      focusKeyword: ver.focus_keyword,
      status: ver.status,
      createdBy: ver.created_by,
      createdAt: ver.created_at,
    };
  }

  async updateContentVersion(
    tenantId: string,
    versionId: string,
    updates: Partial<ContentVersion>
  ): Promise<ContentVersion> {
    const supabase = this.ensureClient();
    const payload: Record<string, unknown> = {};
    if (updates.title) payload.title = updates.title;
    if (updates.bodyMarkdown) payload.body_markdown = updates.bodyMarkdown;
    if (updates.seoTitle) payload.seo_title = updates.seoTitle;
    if (updates.metaDescription) payload.meta_description = updates.metaDescription;

    const { data, error } = await supabase.from('content_versions').update(payload).eq('id', versionId).select().single();
    if (error || !data) throw new Error(error?.message || 'Sürüm güncellenemedi.');
    return {
      id: data.id,
      contentItemId: data.content_item_id,
      versionNumber: data.version_number,
      title: data.title,
      bodyMarkdown: data.body_markdown,
      outline: data.outline || [],
      seoTitle: data.seo_title,
      metaDescription: data.meta_description,
      slug: data.slug,
      focusKeyword: data.focus_keyword,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  async listReviewItems(tenantId: string): Promise<ReviewItem[]> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('review_items').select('*').eq('tenant_id', tenantId).eq('status', 'pending');
    return (data || []).map(r => ({
      id: r.id,
      tenantId: r.tenant_id,
      type: r.type,
      targetId: r.target_id,
      targetTitle: r.target_title,
      status: r.status,
      metadata: r.metadata || {},
      createdAt: r.created_at,
    }));
  }

  async submitReviewDecision(
    tenantId: string,
    reviewItemId: string,
    decision: 'approved' | 'rejected',
    reviewerUserId: string,
    notes?: string
  ): Promise<boolean> {
    const supabase = this.ensureClient();
    const { error } = await supabase
      .from('review_items')
      .update({
        status: decision,
        reviewed_by: reviewerUserId,
        reviewed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', reviewItemId)
      .eq('tenant_id', tenantId);
    return !error;
  }

  async triggerScanJob(tenantId: string, actorUserId: string): Promise<{ job: Job; alreadyRunning: boolean }> {
    const supabase = this.ensureClient();
    const { data: running } = await supabase
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'running')
      .eq('type', 'scan')
      .maybeSingle();

    if (running) {
      return {
        job: {
          id: running.id,
          tenantId: running.tenant_id,
          type: running.type,
          status: running.status,
          idempotencyKey: running.idempotency_key,
          payload: running.payload || {},
          createdAt: running.created_at,
        },
        alreadyRunning: true,
      };
    }

    const { data: created, error } = await supabase
      .from('jobs')
      .insert({
        tenant_id: tenantId,
        type: 'scan',
        status: 'pending',
        idempotency_key: `scan-${tenantId}-${Date.now()}`,
        payload: { triggeredBy: actorUserId },
      })
      .select()
      .single();

    if (error || !created) throw new Error(error?.message || 'Tarama işi başlatılamadı.');

    return {
      job: {
        id: created.id,
        tenantId: created.tenant_id,
        type: created.type,
        status: created.status,
        idempotencyKey: created.idempotency_key,
        payload: created.payload || {},
        createdAt: created.created_at,
      },
      alreadyRunning: false,
    };
  }

  async getJob(tenantId: string, jobId: string): Promise<Job | null> {
    const supabase = this.ensureClient();
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).eq('tenant_id', tenantId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      type: data.type,
      status: data.status,
      idempotencyKey: data.idempotency_key,
      payload: data.payload || {},
      createdAt: data.created_at,
    };
  }

  async listRecentJobs(tenantId?: string): Promise<Job[]> {
    const supabase = this.ensureClient();
    let q = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(20);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    return (data || []).map(j => ({
      id: j.id,
      tenantId: j.tenant_id,
      type: j.type,
      status: j.status,
      idempotencyKey: j.idempotency_key,
      payload: j.payload || {},
      createdAt: j.created_at,
    }));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const supabase = this.ensureClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        tenant_id: log.tenantId,
        actor_user_id: log.actorUserId,
        actor_email: log.actorEmail,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        details: log.details,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        id: `audit-${Date.now()}`,
        ...log,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      actorUserId: data.actor_user_id,
      actorEmail: data.actor_email,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      details: data.details,
      createdAt: data.created_at,
    };
  }

  async listAuditLogs(tenantId?: string): Promise<AuditLog[]> {
    const supabase = this.ensureClient();
    let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    return (data || []).map(a => ({
      id: a.id,
      tenantId: a.tenant_id,
      actorUserId: a.actor_user_id,
      actorEmail: a.actor_email,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      details: a.details,
      createdAt: a.created_at,
    }));
  }
}
