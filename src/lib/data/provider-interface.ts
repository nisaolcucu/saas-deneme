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

export interface DataProvider {
  // Tenancy & Membership
  getTenant(tenantId: string): Promise<Tenant | null>;
  listTenants(): Promise<Tenant[]>;
  getUserMemberships(userId: string): Promise<TenantMembership[]>;
  isPlatformAdmin(userId: string): Promise<boolean>;
  getTenantMembers(tenantId: string): Promise<(TenantMembership & { user: User })[]>;
  updateTenantStatus(tenantId: string, status: 'active' | 'suspended', actorUserId: string): Promise<boolean>;
  listAllUsers(): Promise<UserWithDetails[]>;
  updateUserStatus(userId: string, status: 'active' | 'suspended', actorUserId: string): Promise<boolean>;

  // Applications (Super Admin)
  listApplications(): Promise<AccountApplication[]>;
  getApplicationByUserId(userId: string): Promise<AccountApplication | null>;
  submitApplication(data: {
    userId: string;
    userEmail: string;
    userFullName: string;
    companyName: string;
    note?: string;
  }): Promise<AccountApplication>;
  reviewApplication(
    applicationId: string, 
    action: 'approved' | 'rejected', 
    reviewerUserId: string,
    rejectionReason?: string
  ): Promise<{ application: AccountApplication; tenant?: Tenant; membership?: TenantMembership }>;

  // Brand Profile
  getActiveBrandProfile(tenantId: string): Promise<BrandProfile | null>;
  listBrandProfiles(tenantId: string): Promise<BrandProfile[]>;
  saveBrandProfileDraft(tenantId: string, data: Partial<BrandProfile>): Promise<BrandProfile>;
  activateBrandProfile(tenantId: string, profileId: string, actorUserId: string): Promise<BrandProfile>;

  // Scan Settings & Keywords
  getScanSettings(tenantId: string): Promise<ScanSettings>;
  updateScanSettings(tenantId: string, settings: Partial<ScanSettings>): Promise<ScanSettings>;
  listKeywords(tenantId: string): Promise<Keyword[]>;
  addKeyword(tenantId: string, keyword: string, category: string): Promise<Keyword>;
  removeKeyword(tenantId: string, keywordId: string): Promise<boolean>;
  toggleKeyword(tenantId: string, keywordId: string): Promise<Keyword>;

  // Candidate Sources (Scan results)
  listSources(tenantId: string, status?: string): Promise<CandidateSource[]>;
  getSource(tenantId: string, sourceId: string): Promise<CandidateSource | null>;
  reviewSource(
    tenantId: string, 
    sourceId: string, 
    decision: 'approved' | 'rejected', 
    reviewerUserId: string
  ): Promise<CandidateSource>;

  // Content Pipeline & Versions
  listContentItems(tenantId: string, status?: string): Promise<ContentItem[]>;
  getContentItem(tenantId: string, contentId: string): Promise<ContentItem | null>;
  getContentVersions(contentId: string): Promise<ContentVersion[]>;
  createNewDraftVersion(
    tenantId: string, 
    contentId: string, 
    actorUserId: string,
    actorName: string
  ): Promise<ContentVersion>;
  updateContentVersion(
    tenantId: string,
    versionId: string,
    updates: Partial<ContentVersion>
  ): Promise<ContentVersion>;

  // Review Queue
  listReviewItems(tenantId: string): Promise<ReviewItem[]>;
  submitReviewDecision(
    tenantId: string,
    reviewItemId: string,
    decision: 'approved' | 'rejected',
    reviewerUserId: string,
    notes?: string
  ): Promise<boolean>;

  // Jobs & Automation
  triggerScanJob(tenantId: string, actorUserId: string): Promise<{ job: Job; alreadyRunning: boolean }>;
  getJob(tenantId: string, jobId: string): Promise<Job | null>;
  listRecentJobs(tenantId?: string): Promise<Job[]>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  listAuditLogs(tenantId?: string): Promise<AuditLog[]>;
}
