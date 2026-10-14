export interface ParsedBrandProfileResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    targetAudience: string;
    tone: string;
    bannedWords: string[];
    preferredKeywords: string[];
    markdownRaw: string;
  };
}

const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript:/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
  /<form\b[^>]*>/gi,
];

export function parseBrandProfileMarkdown(rawText: string): ParsedBrandProfileResult {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'İçerik boş olamaz.' };
  }

  // 1. Boyut kontrolü (< 512 KB)
  const byteLength = new TextEncoder().encode(rawText).length;
  if (byteLength > MAX_FILE_SIZE_BYTES) {
    return { 
      success: false, 
      error: `Dosya boyutu çok büyük (${Math.round(byteLength / 1024)} KB). Maksimum izin verilen boyut 512 KB'dır.` 
    };
  }

  // 2. Güvenlik ve zararlı kod kontrolü
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(rawText)) {
      return { 
        success: false, 
        error: 'Güvenlik ihlali: Belgede çalıştırılabilir komut veya güvensiz HTML etiketleri tespit edildi.' 
      };
    }
  }

  // 3. Bölüm ayrıştırma (Deterministik Regex)
  const lines = rawText.split('\n');
  let currentSection = '';
  const sections: Record<string, string[]> = {
    marka: [],
    hedefkitle: [],
    ton: [],
    terimler: [],
    yasakli: [],
    diger: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const headerTitle = trimmed.replace(/^#+\s*/, '').toLowerCase();
      if (headerTitle.includes('marka ad') || headerTitle.includes('şirket')) {
        currentSection = 'marka';
      } else if (headerTitle.includes('hedef kitle') || headerTitle.includes('okuyucu')) {
        currentSection = 'hedefkitle';
      } else if (headerTitle.includes('ton') || headerTitle.includes('üslup') || headerTitle.includes('uslup')) {
        currentSection = 'ton';
      } else if (headerTitle.includes('tercih') || headerTitle.includes('terim') || headerTitle.includes('anahtar')) {
        currentSection = 'terimler';
      } else if (headerTitle.includes('yasak') || headerTitle.includes('kullanılmayacak') || headerTitle.includes('kacin')) {
        currentSection = 'yasakli';
      } else {
        currentSection = 'diger';
      }
      continue;
    }

    if (currentSection && trimmed.length > 0) {
      sections[currentSection].push(trimmed);
    }
  }

  const cleanList = (items: string[]): string[] => {
    return items
      .map(item => item.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(item => item.length > 0);
  };

  const name = cleanList(sections.marka).join(' ') || 'Marka Profili';
  const targetAudience = sections.hedefkitle
    .map(i => i.replace(/^[-*•\d.]+\s*/, '').trim())
    .join(', ') || 'Genel Sektör Okuyucuları';
  const tone = sections.ton
    .map(i => i.replace(/^[-*•\d.]+\s*/, '').trim())
    .join('. ') || 'Profesyonel, bilgilendirici ve doğrudan';
  
  const preferredKeywords = cleanList(sections.terimler);
  const bannedWords = cleanList(sections.yasakli);

  return {
    success: true,
    data: {
      name,
      targetAudience,
      tone,
      bannedWords,
      preferredKeywords,
      markdownRaw: rawText,
    },
  };
}
