import { DataProvider } from './provider-interface';
import { demoDataProvider } from './demo-provider';
import { SupabaseDataProvider } from './supabase-provider';

let activeProvider: DataProvider;

export function getDataProvider(): DataProvider {
  if (!activeProvider) {
    const isLiveMode = process.env.NEXT_PUBLIC_APP_MODE === 'live' && 
                       !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isLiveMode) {
      activeProvider = new SupabaseDataProvider();
    } else {
      activeProvider = demoDataProvider;
    }
  }
  return activeProvider;
}

export * from './provider-interface';
export * from './demo-data';
export * from './demo-provider';
