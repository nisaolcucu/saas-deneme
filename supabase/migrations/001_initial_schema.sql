-- blogüret Multi-Tenant Veritabanı Şeması ve RLS Güvenlik Politikaları

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Şirketler)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  is_owner_tenant BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users (Kullanıcılar)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_initials TEXT NOT NULL DEFAULT 'KU',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tenant Memberships (Şirket Üyelikleri)
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('tenant_admin', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 4. Platform Admins (Süper Adminler - Kullanıcı metadatası dışında korumalı tablo)
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Account Applications (Kayıt Başvuruları)
CREATE TABLE IF NOT EXISTS account_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Brand Profiles (Marka Profilleri)
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  tone TEXT NOT NULL,
  banned_words TEXT[] DEFAULT '{}',
  preferred_keywords TEXT[] DEFAULT '{}',
  markdown_raw TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  UNIQUE(tenant_id, version)
);

-- 7. Scan Settings (Tarama Ayarları)
CREATE TABLE IF NOT EXISTS scan_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  scan_frequency TEXT NOT NULL DEFAULT 'daily',
  target_count_per_run INT NOT NULL DEFAULT 5,
  auto_summarize BOOLEAN NOT NULL DEFAULT TRUE,
  min_relevance_score INT NOT NULL DEFAULT 70,
  language TEXT NOT NULL DEFAULT 'tr',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Keywords (Anahtar Kelimeler)
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Genel',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, keyword)
);

-- 9. Sources (Aday ve Onaylanan Kaynaklar)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  citation_key TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  relevance_score INT NOT NULL DEFAULT 80,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Content Items (Blog Yazıları)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'outline_review', 'final_review', 'ready', 'published')),
  current_version_number INT NOT NULL DEFAULT 1,
  brand_profile_version INT NOT NULL DEFAULT 1,
  author_name TEXT NOT NULL DEFAULT 'Editör',
  category TEXT NOT NULL DEFAULT 'Blog',
  seo_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  focus_keyword TEXT NOT NULL,
  source_ids TEXT[] DEFAULT '{}',
  word_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- 11. Content Versions (İçerik Sürüm Geçmişi)
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  outline TEXT[] DEFAULT '{}',
  seo_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  slug TEXT NOT NULL,
  focus_keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_item_id, version_number)
);

-- 12. Review Items (Onay Kuyruğu Öğeleri)
CREATE TABLE IF NOT EXISTS review_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('source', 'outline', 'final')),
  target_id TEXT NOT NULL,
  target_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Jobs (Otomasyon İşleri)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('scan', 'outline_generation', 'content_generation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 14. Audit Logs (Denetim Kayıtları)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Usage Events (Kullanım Olayları)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. RLS (Row Level Security) Etkinleştirme
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper RLS Fonksiyonları
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Politikaları Örnekleri:
-- Tenants tablosu: Üyeler ve Süper Admin görebilir
CREATE POLICY "Tenants read access" ON tenants
  FOR SELECT USING (has_tenant_access(id));

-- Sources tablosu: Yalnızca kendi tenant'ının kaynakları
CREATE POLICY "Sources tenant isolation" ON sources
  FOR ALL USING (has_tenant_access(tenant_id));

-- Content Items: Yalnızca kendi tenant'ının içerikleri
CREATE POLICY "Content items tenant isolation" ON content_items
  FOR ALL USING (has_tenant_access(tenant_id));

-- Account Applications: Yalnızca Süper Admin görebilir veya başvuran kendi kaydını görebilir
CREATE POLICY "Applications view policy" ON account_applications
  FOR SELECT USING (is_super_admin() OR user_id = auth.uid());
