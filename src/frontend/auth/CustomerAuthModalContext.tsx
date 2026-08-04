'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { create } from 'zustand';

export type CustomerAuthModalTab = 'login' | 'register';

interface CustomerAuthModalState {
  isOpen: boolean;
  activeTab: CustomerAuthModalTab;
  openAuthModal: (tab?: CustomerAuthModalTab) => void;
  closeAuthModal: () => void;
  setActiveTab: (tab: CustomerAuthModalTab) => void;
}

/**
 * Zustand store — usable from route guards / nav without React context nesting.
 * Keeps open/close available even when FrontendAuthGuard sits outside the Provider.
 */
export const useCustomerAuthModalStore = create<CustomerAuthModalState>((set) => ({
  isOpen: false,
  activeTab: 'login',
  openAuthModal: (tab: CustomerAuthModalTab = 'login') => set({ isOpen: true, activeTab: tab }),
  closeAuthModal: () => set({ isOpen: false }),
  setActiveTab: (tab: CustomerAuthModalTab) => set({ activeTab: tab }),
}));

type CustomerAuthModalContextValue = CustomerAuthModalState;

const CustomerAuthModalContext = createContext<CustomerAuthModalContextValue | null>(null);

export function CustomerAuthModalProvider({ children }: { children: React.ReactNode }) {
  const isOpen = useCustomerAuthModalStore((s) => s.isOpen);
  const activeTab = useCustomerAuthModalStore((s) => s.activeTab);
  const openAuthModal = useCustomerAuthModalStore((s) => s.openAuthModal);
  const closeAuthModal = useCustomerAuthModalStore((s) => s.closeAuthModal);
  const setActiveTab = useCustomerAuthModalStore((s) => s.setActiveTab);

  const value = useMemo(
    () => ({
      isOpen,
      activeTab,
      openAuthModal,
      closeAuthModal,
      setActiveTab,
    }),
    [isOpen, activeTab, openAuthModal, closeAuthModal, setActiveTab],
  );

  return <CustomerAuthModalContext.Provider value={value}>{children}</CustomerAuthModalContext.Provider>;
}

export function useCustomerAuthModal() {
  const context = useContext(CustomerAuthModalContext);
  const store = useCustomerAuthModalStore();
  return context ?? store;
}

/** Safe for product cards / guards that may render outside the modal provider. */
export function useOptionalCustomerAuthModal() {
  const context = useContext(CustomerAuthModalContext);
  const store = useCustomerAuthModalStore();
  return context ?? store;
}
