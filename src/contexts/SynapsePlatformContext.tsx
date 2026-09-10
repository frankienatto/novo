import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { SynapseOrganization, SynapseProperty, SynapseUser } from '../types/synapseTypes';
import { getCanonicalSession } from '../../services/canonicalPmsRuntime';
import { auth } from '../../services/firebase';

interface SynapsePlatformContextType {
  activeOrg: SynapseOrganization;
  activeProperty: SynapseProperty;
  user: SynapseUser;
  organizations: SynapseOrganization[];
  properties: SynapseProperty[];
  setOrganization: (orgId: string) => void;
  setProperty: (propId: string) => void;
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  closeCopilot: () => void;
  openCopilot: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  pendingApprovalsCount: number;
  setPendingApprovalsCount: (count: number) => void;
}

const demoOrg: SynapseOrganization = {
  id: 'org_dev_default',
  name: 'Forest House Hospitality Group',
  code: 'FH-GROUP',
};

const demoProperty: SynapseProperty = {
  id: 'prop_dev_default',
  orgId: 'org_dev_default',
  name: 'Forest House Beach Hostel',
  city: 'Florianópolis, SC',
  status: 'active',
};

const demoUser: SynapseUser = {
  id: 'usr_exec_01',
  name: 'Diretoria Executiva',
  email: 'diretoria@foresthouse.com.br',
  role: 'executive',
};

const SynapsePlatformContext = createContext<SynapsePlatformContextType | undefined>(undefined);

export const SynapsePlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDemoRuntime = !import.meta.env.PROD;
  const emptyOrg: SynapseOrganization = { id: '', name: '', code: '' };
  const emptyProperty: SynapseProperty = { id: '', orgId: '', name: '', city: '', status: 'setup' };
  const emptyUser: SynapseUser = { id: '', name: '', email: '', role: 'operator' };
  const [activeOrg, setActiveOrg] = useState<SynapseOrganization>(isDemoRuntime ? demoOrg : emptyOrg);
  const [activeProperty, setActiveProperty] = useState<SynapseProperty>(isDemoRuntime ? demoProperty : emptyProperty);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('executive');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(3);

  const organizations: SynapseOrganization[] = isDemoRuntime ? [
    demoOrg,
    { id: 'org_boutique_02', name: 'Boutique Hotels Brasil', code: 'BHB' },
  ] : [];

  const properties: SynapseProperty[] = isDemoRuntime ? [
    demoProperty,
    { id: 'prop_mountain_02', orgId: 'org_dev_default', name: 'Forest House Mountain Lodge', city: 'Gramado, RS', status: 'active' },
  ] : [];

  useEffect(() => {
    if (!isDemoRuntime) return;
    localStorage.setItem('synapse_org_id', activeOrg.id);
    localStorage.setItem('synapse_prop_id', activeProperty.id);
  }, [activeOrg, activeProperty, isDemoRuntime]);

  // In staging/production the only authority for the executive context is the
  // authenticated SaaS session. Demo identifiers never fill a missing tenant.
  useEffect(() => {
    if (isDemoRuntime) return;
    let active = true;
    const clearContext = () => {
      if (!active) return;
      setActiveOrg(emptyOrg);
      setActiveProperty(emptyProperty);
    };
    const loadSession = async () => {
      try {
        const session = await getCanonicalSession();
        if (!active) return;
        setActiveOrg({ id: session.organizationId, name: '', code: '' });
        setActiveProperty({ id: session.propertyId, orgId: session.organizationId, name: '', city: '', status: 'active' });
      } catch {
        clearContext();
      }
    };

    // Firebase restores the authenticated user asynchronously. Waiting for this
    // transition keeps the production context structurally empty until the
    // canonical session can be read, instead of treating a transient null user
    // as an unprovisioned tenant.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) void loadSession();
      else clearContext();
    });
    return () => { active = false; unsubscribe(); };
  }, [isDemoRuntime]);

  const setOrganization = (orgId: string) => {
    const found = organizations.find((o) => o.id === orgId);
    if (found) setActiveOrg(found);
  };

  const setProperty = (propId: string) => {
    const found = properties.find((p) => p.id === propId);
    if (found) setActiveProperty(found);
  };

  const toggleCopilot = () => setIsCopilotOpen((prev) => !prev);
  const closeCopilot = () => setIsCopilotOpen(false);
  const openCopilot = () => setIsCopilotOpen(true);

  return (
    <SynapsePlatformContext.Provider
      value={{
        activeOrg,
        activeProperty,
        user: isDemoRuntime ? demoUser : emptyUser,
        organizations,
        properties,
        setOrganization,
        setProperty,
        isCopilotOpen,
        toggleCopilot,
        closeCopilot,
        openCopilot,
        activeModule,
        setActiveModule,
        pendingApprovalsCount,
        setPendingApprovalsCount,
      }}
    >
      {children}
    </SynapsePlatformContext.Provider>
  );
};

export const useSynapsePlatform = (): SynapsePlatformContextType => {
  const context = useContext(SynapsePlatformContext);
  if (!context) {
    throw new Error('useSynapsePlatform deve ser utilizado dentro de SynapsePlatformProvider');
  }
  return context;
};
