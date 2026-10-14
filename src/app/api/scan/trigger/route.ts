import { NextRequest, NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/data';
import { triggerN8nScanWorkflow } from '@/lib/n8n/adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, actorUserId } = body;

    if (!tenantId || !actorUserId) {
      return NextResponse.json({ error: 'tenantId ve actorUserId zorunludur' }, { status: 400 });
    }

    const provider = getDataProvider();
    const tenant = await provider.getTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 });
    }

    if (tenant.status === 'suspended') {
      return NextResponse.json({ error: 'Bu şirket hesabı askıya alınmıştır. İşlem yapılamaz.' }, { status: 403 });
    }

    // Trigger local / db job
    const { job, alreadyRunning } = await provider.triggerScanJob(tenantId, actorUserId);

    if (alreadyRunning) {
      return NextResponse.json({
        success: false,
        message: 'Bu şirket için devam eden aktif bir tarama zaten mevcut.',
        job,
      });
    }

    // Call n8n adapter
    const keywords = await provider.listKeywords(tenantId);
    const brandProfile = await provider.getActiveBrandProfile(tenantId);
    const settings = await provider.getScanSettings(tenantId);

    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    const n8nResult = await triggerN8nScanWorkflow({
      tenantId,
      tenantName: tenant.name,
      jobId: job.id,
      idempotencyKey: job.idempotencyKey,
      keywords: keywords.filter(k => k.isActive).map(k => k.keyword),
      targetCount: settings.targetCountPerRun,
      minRelevanceScore: settings.minRelevanceScore,
      language: settings.language,
      brandProfile: {
        name: brandProfile?.name || tenant.name,
        tone: brandProfile?.tone || 'Profesyonel',
        targetAudience: brandProfile?.targetAudience || 'Sektör profesyonelleri',
        preferredKeywords: brandProfile?.preferredKeywords || [],
        bannedWords: brandProfile?.bannedWords || [],
      },
      callbackUrl: `${baseUrl}/api/n8n/callback`,
    });

    return NextResponse.json({
      success: true,
      job,
      n8nResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: 'İşlem başarısız', message }, { status: 500 });
  }
}
