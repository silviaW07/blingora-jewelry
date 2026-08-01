'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type CustomerAuthModalTab = 'login' | 'register';

interface CustomerAuthModalContextValue {
  isOpen: boolean;
  activeTab: CustomerAuthModalTab;
  openAuthModal: (tab?: CustomerAuthModalTab) => void;
  closeAuthModal: () => void;
  setActiveTab: (tab: CustomerAuthModalTab) => void;
}

const CustomerAuthModalContext = createContext<CustomerAuthModalContextValue | null>(null);

export function CustomerAuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerAuthModalTab>('login');

  const openAuthModal = useCallback((tab: CustomerAuthModalTab = 'login') => {
    setActiveTab(tab);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeTab,
      openAuthModal,
      closeAuthModal,
      setActiveTab,
    }),
    [isOpen, activeTab, openAuthModal, closeAuthModal],
  );

  return <CustomerAuthModalContext.Provider value={value}>{children}</CustomerAuthModalContext.Provider>;
}

export function useCustomerAuthModal() {
  const context = useContext(CustomerAuthModalContext);
  if (!context) {
    throw new Error('useCustomerAuthModal must be used within CustomerAuthModalProvider');
  }
  return context;
}
