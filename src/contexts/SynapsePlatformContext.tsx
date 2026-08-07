import React, { createContext, useContext, useState, useEffect } from 'react';
import { SynapseOrganization, SynapseProperty, SynapseUser } from '../types/synapseTypes';

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

const defaultOrg: SynapseOrganization = {
  id: 'org_dev_default',
  name: 'Forest House Hospitality Group',
  code: 'FH-GROUP',
};

const defaultProperty: SynapseProperty = {
  id: 'prop_dev_default',
  orgId: 'org_dev_default',
  name: 'Forest House Beach Hostel',
  city: 'Florianópolis, SC',
  status: 'active',
};

const defaultUser: SynapseUser = {
  id: 'usr_exec_01',
  name: 'Diretoria Executiva',
  email: 'diretoria@foresthouse.com.br',
  role: 'executive',
};

const SynapsePlatformContext = createContext<SynapsePlatformContextType | undefined>(undefined);

export const SynapsePlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOrg, setActiveOrg] = useState<SynapseOrganization>(defaultOrg);
  const [activeProperty, setActiveProperty] = useState<SynapseProperty>(defaultProperty);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('executive');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(3);

  const organizations: SynapseOrganization[] = [
    defaultOrg,
    { id: 'org_boutique_02', name: 'Boutique Hotels Brasil', code: 'BHB' },
  ];

  const properties: SynapseProperty[] = [
    defaultProperty,
    { id: 'prop_mountain_02', orgId: 'org_dev_default', name: 'Forest House Mountain Lodge', city: 'Gramado, RS', status: 'active' },
  ];

  useEffect(() => {
    localStorage.setItem('synapse_org_id', activeOrg.id);
    localStorage.setItem('synapse_prop_id', activeProperty.id);
  }, [activeOrg, activeProperty]);

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
        user: defaultUser,
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
