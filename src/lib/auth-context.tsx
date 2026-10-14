'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Tenant, TenantMembership, AccountApplication } from '@/types';
import { getDataProvider } from './data';
import { INITIAL_USERS } from './data/demo-data';
import { verifyEncodedCredentials } from './auth-security';

interface AuthContextType {
  user: User | null;
  activeTenant: Tenant | null;
  userMemberships: TenantMembership[];
  accessibleTenants: Tenant[];
  isSuperAdmin: boolean;
  isPendingApplicant: boolean;
  userRole: 'tenant_admin' | 'editor' | null;
  pendingApplication: AccountApplication | null;
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  loginAs: (userId: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [userMemberships, setUserMemberships] = useState<TenantMembership[]>([]);
  const [accessibleTenants, setAccessibleTenants] = useState<Tenant[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isPendingApplicant, setIsPendingApplicant] = useState<boolean>(false);
  const [pendingApplication, setPendingApplication] = useState<AccountApplication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const provider = getDataProvider();

  const loadUserData = useCallback(async (selectedUserId: string) => {
    setIsLoading(true);
    try {
      const allUsers = INITIAL_USERS;
      const foundUser = allUsers.find(u => u.id === selectedUserId);
      if (!foundUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser(foundUser);

      // Check Super Admin status
      const adminStatus = await provider.isPlatformAdmin(foundUser.id);
      setIsSuperAdmin(adminStatus);

      // Check Memberships
      const mems = await provider.getUserMemberships(foundUser.id);
      setUserMemberships(mems);

      // Check Pending Application
      const app = await provider.getApplicationByUserId(foundUser.id);
      if (app && app.status === 'pending') {
        setIsPendingApplicant(true);
        setPendingApplication(app);
        setActiveTenant(null);
        setAccessibleTenants([]);
        setIsLoading(false);
        return;
      } else {
        setIsPendingApplicant(false);
        setPendingApplication(null);
      }

      // If Super Admin, can observe all tenants, but default to İstasyon or first tenant
      const allTenants = await provider.listTenants();
      if (adminStatus) {
        setAccessibleTenants(allTenants);
        const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('bloguret_active_tenant') : null;
        const tenantToSet = allTenants.find(t => t.id === savedTenantId) || allTenants[0];
        setActiveTenant(tenantToSet);
      } else {
        // Strict tenant isolation: User can ONLY access tenants they have active membership in!
        const userTenants = allTenants.filter(t => mems.some(m => m.tenantId === t.id));
        setAccessibleTenants(userTenants);
        const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('bloguret_active_tenant') : null;
        const tenantToSet = userTenants.find(t => t.id === savedTenantId) || userTenants[0] || null;
        setActiveTenant(tenantToSet);
      }
    } catch (err) {
      console.error('Failed to load user state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    // Initial load: Only log in if a previous session exists in localStorage!
    // Otherwise, show the Login screen for security.
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('bloguret_demo_user_id') : null;
    if (savedUserId) {
      loadUserData(savedUserId);
    } else {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const switchTenant = async (tenantId: string) => {
    // Verify membership or superadmin
    if (!isSuperAdmin) {
      const hasAccess = userMemberships.some(m => m.tenantId === tenantId);
      if (!hasAccess) {
        throw new Error('Yetkisiz işlem: Bu şirkete erişim yetkiniz bulunmuyor.');
      }
    }
    const tenant = await provider.getTenant(tenantId);
    if (tenant) {
      setActiveTenant(tenant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bloguret_active_tenant', tenant.id);
      }
    }
  };

  const loginAs = async (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bloguret_demo_user_id', userId);
      localStorage.removeItem('bloguret_active_tenant'); // reset active tenant on persona switch
    }
    await loadUserData(userId);
  };

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const verification = verifyEncodedCredentials(email, password);
    if (!verification.valid || !verification.userId) {
      return { success: false, error: verification.error || 'Giriş bilgileri geçersiz.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('bloguret_demo_user_id', verification.userId);
      localStorage.removeItem('bloguret_active_tenant');
    }

    await loadUserData(verification.userId);
    return { success: true };
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bloguret_demo_user_id');
      localStorage.removeItem('bloguret_active_tenant');
    }
    setUser(null);
    setActiveTenant(null);
    setUserMemberships([]);
    setAccessibleTenants([]);
    setIsSuperAdmin(false);
    setIsPendingApplicant(false);
  };

  const refreshAuth = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const currentMembership = user && activeTenant 
    ? userMemberships.find(m => m.tenantId === activeTenant.id) 
    : null;
  const userRole = isSuperAdmin ? 'tenant_admin' : (currentMembership?.role || null);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTenant,
        userMemberships,
        accessibleTenants,
        isSuperAdmin,
        isPendingApplicant,
        userRole,
        pendingApplication,
        isLoading,
        switchTenant,
        loginAs,
        loginWithCredentials,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
