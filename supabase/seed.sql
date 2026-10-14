-- blogüret Örnek Tohum Verileri (Gizli şifre içermez)

-- 1. Şirketler
INSERT INTO tenants (id, name, slug, status, is_owner_tenant) VALUES
  ('11111111-1111-1111-1111-111111111111', 'İstasyon Ekibi', 'istasyon-ekibi', 'active', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Yeşil Enerji Ajansı', 'yesil-enerji-ajansi', 'active', FALSE),
  ('33333333-3333-3333-3333-333333333333', 'Pamuk Adım Çorap', 'pamuk-adim-corap', 'active', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Örnek Kullanıcılar
INSERT INTO users (id, email, full_name, avatar_initials) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'superadmin@bloguret.com', 'Sistem Yöneticisi', 'SY'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mert@istasyon.ai', 'Mert Aksoy', 'MA'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'elif@yesilenerji.com', 'Elif Yılmaz', 'EA'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'can@yesilenerji.com', 'Can Demir', 'CD'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ahmet@pamukadim.com', 'Ahmet Karaca', 'AK'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'basvuran@yenigirisim.com', 'Murat Arslan', 'MA')
ON CONFLICT (id) DO NOTHING;

-- 3. Süper Admin Tanımı
INSERT INTO platform_admins (id, user_id) VALUES
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Şirket Üyelikleri
INSERT INTO tenant_memberships (tenant_id, user_id, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant_admin', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'tenant_admin', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'editor', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'tenant_admin', TRUE)
ON CONFLICT DO NOTHING;

-- 5. Bekleyen Başvuru
INSERT INTO account_applications (id, user_id, user_email, user_full_name, company_name, note, status) VALUES
  ('88888888-8888-8888-8888-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'basvuran@yenigirisim.com', 'Murat Arslan', 'Yeni Girişim Bilişim Ltd.', 'B2B SaaS blog içeriklerimizi otomatikleştirmek istiyoruz.', 'pending')
ON CONFLICT DO NOTHING;
