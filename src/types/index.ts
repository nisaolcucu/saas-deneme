export type UserRole = 'tenant_admin' | 'editor';

export type TenantStatus = 'active' | 'suspended';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type SourceStatus = 'pending_review' | 'approved' | 'rejected';

export type ContentStatus = 
  | 'draft' 
  | 'outline_review' 
  | 'final_review' 
  | 'ready' 
  | 'published';

export type JobType = 'scan' | 'outline_generation' | 'content_generation';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  isOwnerTenant?: boolean; // Platform sahibi şirketimiz (İstasyon Ekibi)
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarInitials: string;
  createdAt: string;
}

export interface UserMembershipDetail {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserWithDetails extends User {
  isPlatformAdmin: boolean;
  status: 'active' | 'suspended' | 'pending';
  memberships: UserMembershipDetail[];
  application?: AccountApplication;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformAdmin {
  id: string;
  userId: string;
  createdAt: string;
}

export interface AccountApplication {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  companyName: string;
  note?: string;
  status: ApplicationStatus;
  assignedTenantId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface BrandProfile {
  id: string;
  tenantId: string;
  version: number; // 1, 2, 3...
  status: 'draft' | 'active' | 'archived';
  name: string;
  targetAudience: string;
  tone: string;
  bannedWords: string[];
  preferredKeywords: string[];
  markdownRaw: string;
  createdAt: string;
  activatedAt?: string;
}

export interface ScanSettings {
  id: string;
  tenantId: string;
  scanFrequency: 'manual' | 'daily' | 'weekly';
  targetCountPerRun: number;
  autoSummarize: boolean;
  minRelevanceScore: number;
  language: string;
  updatedAt: string;
}

export interface Keyword {
  id: string;
  tenantId: string;
  keyword: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface CandidateSource {
  id: string;
  tenantId: string;
  title: string;
  url: string;
  snippet: string;
  citationKey: string; // e.g. "S1", "S2", "S3"
  status: SourceStatus;
  relevanceScore: number; // 0 - 100
  discoveredAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  summary?: string;
}

export interface ContentVersion {
  id: string;
  contentItemId: string;
  versionNumber: number;
  title: string;
  bodyMarkdown: string;
  outline: string[];
  seoTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  status: ContentStatus;
  createdBy: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  status: ContentStatus;
  currentVersionNumber: number;
  brandProfileVersion: number;
  authorName: string;
  category: string; // e.g. "Blog"
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  sourceIds: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  versions?: ContentVersion[];
}

export interface OutlineSection {
  id: string;
  heading: string;
  level: 'h2' | 'h3';
  scopeDescription: string;
  keyArguments: string[];
  plannedCitations: string[];
  estimatedWords: number;
}

export interface ReviewItem {
  id: string;
  tenantId: string;
  type: 'source' | 'outline' | 'final';
  targetId: string;
  targetTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  metadata: {
    sourceSnippet?: string;
    sourceUrl?: string;
    citationKey?: string;
    outlinePoints?: string[];
    outlineSections?: OutlineSection[];
    targetAudienceSummary?: string;
    coreThesis?: string;
    estimatedTotalWords?: number;
    draftPreview?: string;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  tenantId: string;
  type: JobType;
  status: JobStatus;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface UsageEvent {
  id: string;
  tenantId: string;
  eventType: 'scan_run' | 'outline_generated' | 'article_completed';
  quantity: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
