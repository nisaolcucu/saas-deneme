import { z } from 'zod';

export const N8nScanTriggerPayloadSchema = z.object({
  tenantId: z.string().min(1),
  tenantName: z.string().min(1),
  jobId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  targetCount: z.number().int().positive().default(5),
  minRelevanceScore: z.number().min(0).max(100).default(70),
  language: z.string().default('tr'),
  brandProfile: z.object({
    name: z.string(),
    tone: z.string(),
    targetAudience: z.string(),
    preferredKeywords: z.array(z.string()),
    bannedWords: z.array(z.string()),
  }),
  callbackUrl: z.string().url(),
});

export type N8nScanTriggerPayload = z.infer<typeof N8nScanTriggerPayloadSchema>;

export const N8nDiscoveredSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  snippet: z.string().min(1),
  summary: z.string().optional(),
  relevanceScore: z.number().min(0).max(100),
});

export const N8nCallbackPayloadSchema = z.object({
  secretToken: z.string(),
  jobId: z.string().min(1),
  tenantId: z.string().min(1),
  status: z.enum(['completed', 'failed']),
  sources: z.array(N8nDiscoveredSourceSchema).default([]),
  errorMessage: z.string().optional(),
});

export type N8nCallbackPayload = z.infer<typeof N8nCallbackPayloadSchema>;
