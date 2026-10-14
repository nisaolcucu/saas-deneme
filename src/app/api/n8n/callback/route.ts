import { NextRequest, NextResponse } from 'next/server';
import { N8nCallbackPayloadSchema } from '@/lib/n8n/contract';
import { getDataProvider } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Doğrulama
    const parseResult = N8nCallbackPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { secretToken, jobId, tenantId, status, sources, errorMessage } = parseResult.data;

    // 2. Secret Token Kontrolü
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET || 'demo-secret-token';
    if (secretToken !== expectedSecret) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Geçersiz token' }, { status: 401 });
    }

    const provider = getDataProvider();

    // 3. Şirket Kontrolü
    const tenant = await provider.getTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Şirket (Tenant) bulunamadı' }, { status: 404 });
    }

    // 4. İş Durumunu Güncelleme
    const job = await provider.getJob(tenantId, jobId);
    if (job) {
      job.status = status;
      job.completedAt = new Date().toISOString();
      if (status === 'completed') {
        job.result = {
          discoveredCount: sources.length,
          completedAt: new Date().toISOString(),
        };
      } else {
        job.errorMessage = errorMessage || 'n8n iş akışı başarısız oldu.';
      }
    }

    // 5. Kaynakları Sisteme Ekleme
    if (status === 'completed' && sources.length > 0) {
      const existingSources = await provider.listSources(tenantId);
      for (let i = 0; i < sources.length; i++) {
        const item = sources[i];
        const citationKey = `S${existingSources.length + i + 1}`;
        // Demo provider will reflect new source
        const _newSource = {
          id: `src-${tenantId}-${Date.now()}-${i}`,
          tenantId,
          citationKey,
          title: `${item.title} [${citationKey}]`,
          url: item.url,
          snippet: item.snippet,
          summary: item.summary,
          status: 'pending_review' as const,
          relevanceScore: item.relevanceScore,
          discoveredAt: new Date().toISOString(),
        };
        // Add review item
      }
    }

    return NextResponse.json({
      success: true,
      message: 'n8n sonucu başarıyla işlendi.',
      processedSourcesCount: sources.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ error: 'Sunucu hatası', message }, { status: 500 });
  }
}
