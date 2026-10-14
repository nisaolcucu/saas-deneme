import { N8nScanTriggerPayload, N8nScanTriggerPayloadSchema } from './contract';

export interface TriggerN8nScanResult {
  success: boolean;
  mode: 'live_n8n' | 'simulated_demo';
  message: string;
  n8nExecutionId?: string;
}

export async function triggerN8nScanWorkflow(payload: N8nScanTriggerPayload): Promise<TriggerN8nScanResult> {
  // 1. Zod Doğrulama
  const validation = N8nScanTriggerPayloadSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error(`Geçersiz n8n iş yükü: ${validation.error.issues.map(i => i.message).join(', ')}`);
  }

  const webhookUrl = process.env.N8N_SCAN_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  // 2. Canlı n8n Webhook Çağrısı (eğer tanımlıysa)
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret || '',
          'X-Tenant-Id': payload.tenantId,
          'X-Idempotency-Key': payload.idempotencyKey,
        },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook hatası: HTTP ${response.status} ${response.statusText}`);
      }

      const resJson = await response.json().catch(() => ({}));
      return {
        success: true,
        mode: 'live_n8n',
        message: 'Ortak n8n iş akışı şirket parametreleriyle başarıyla tetiklendi.',
        n8nExecutionId: resJson.executionId || resJson.id,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.warn(`n8n çağrısı başarısız oldu, demo simülasyonuna geçiliyor: ${errorMsg}`);
    }
  }

  // 3. Demo Simülasyon Modu
  return {
    success: true,
    mode: 'simulated_demo',
    message: 'Demo modu: n8n iş akışı şirket ayarları ve anahtar kelimeleriyle yerel olarak simüle edildi.',
  };
}
