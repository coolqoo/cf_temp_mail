import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchEmails, updateEmailStatus, deleteEmail, getEmailDetail } from './api';

export interface Email {
  id: string;
  address: string;
  toAddress: string;
  sender: string;
  subject: string;
  receivedAt: string;
  isRead: boolean;
  textBody?: string | null;
  htmlBody?: string | null;
}

interface AppState {
  apiBaseUrl: string;
  apiSecret: string;
  isAuthenticated: boolean;
  
  emails: Email[];
  totalEmails: number;
  currentPage: number;
  pageSize: number;
  
  selectedEmailId: string | null;
  selectedEmailDetail: Email | null;
  
  filterToAddress: string;
  filterUnreadOnly: boolean;
  
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  login: (url: string, secret: string) => void;
  logout: () => void;
  setPage: (page: number) => void;
  setFilters: (toAddress: string, unreadOnly: boolean) => void;
  selectEmail: (id: string) => void;
  refreshList: () => void;
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
  removeEmail: (id: string) => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const savedUrl = localStorage.getItem('tm_api_url') || '';
    const savedSecret = localStorage.getItem('tm_api_secret') || '';
    return {
      apiBaseUrl: savedUrl,
      apiSecret: savedSecret,
      isAuthenticated: !!(savedUrl && savedSecret),
      emails: [],
      totalEmails: 0,
      currentPage: 1,
      pageSize: 50,
      selectedEmailId: null,
      selectedEmailDetail: null,
      filterToAddress: '',
      filterUnreadOnly: false,
      isLoadingList: false,
      isLoadingDetail: false,
      error: null,
    };
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const clearError = () => updateState({ error: null });

  const login = (url: string, secret: string) => {
    const cleanUrl = url.replace(/\/+$/, '');
    localStorage.setItem('tm_api_url', cleanUrl);
    localStorage.setItem('tm_api_secret', secret);
    updateState({ apiBaseUrl: cleanUrl, apiSecret: secret, isAuthenticated: true, error: null });
  };

  const logout = () => {
    localStorage.removeItem('tm_api_url');
    localStorage.removeItem('tm_api_secret');
    updateState({ apiBaseUrl: '', apiSecret: '', isAuthenticated: false, emails: [], selectedEmailDetail: null, selectedEmailId: null });
  };

  const loadEmails = useCallback(async (page: number, toAddress: string, unreadOnly: boolean) => {
    if (!state.apiBaseUrl || !state.apiSecret) return;
    
    updateState({ isLoadingList: true, error: null });
    try {
      const data = await fetchEmails(state.apiBaseUrl, state.apiSecret, page, state.pageSize, toAddress, unreadOnly);
      updateState({
        emails: data.items,
        totalEmails: data.total,
        currentPage: page,
        isLoadingList: false
      });
      
      // Auto-select first if none selected and items exist
      if (data.items.length > 0 && !state.selectedEmailId) {
        selectEmail(data.items[0].id);
      } else if (data.items.length === 0) {
        updateState({ selectedEmailId: null, selectedEmailDetail: null });
      }
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        logout();
      } else {
        updateState({ error: err.message || 'Failed to fetch emails', isLoadingList: false });
      }
    }
  }, [state.apiBaseUrl, state.apiSecret, state.pageSize, state.selectedEmailId]);

  useEffect(() => {
    if (state.isAuthenticated) {
      loadEmails(state.currentPage, state.filterToAddress, state.filterUnreadOnly);
    }
  }, [state.isAuthenticated, state.currentPage, state.filterToAddress, state.filterUnreadOnly, loadEmails]);

  const selectEmail = async (id: string) => {
    updateState({ selectedEmailId: id, isLoadingDetail: true, error: null });
    try {
      const detail = await getEmailDetail(state.apiBaseUrl, state.apiSecret, id);
      
      if (!detail.isRead) {
        try {
          await updateEmailStatus(state.apiBaseUrl, state.apiSecret, id, true);
          detail.isRead = true;
          // Optimistically update list state 
          setState(prev => ({
            ...prev,
            emails: prev.emails.map(e => e.id === id ? { ...e, isRead: true } : e),
            selectedEmailDetail: detail,
            isLoadingDetail: false
          }));
          return;
        } catch (err) {
          console.error("Failed to auto-mark as read", err);
        }
      }

      updateState({ selectedEmailDetail: detail, isLoadingDetail: false });
    } catch (err: any) {
      updateState({ error: err.message || 'Failed to load email details', isLoadingDetail: false, selectedEmailDetail: null });
    }
  };

  const setPage = (page: number) => {
    updateState({ currentPage: page });
  };

  const setFilters = (toAddress: string, unreadOnly: boolean) => {
    updateState({ filterToAddress: toAddress, filterUnreadOnly: unreadOnly, currentPage: 1, selectedEmailId: null, selectedEmailDetail: null });
  };

  const refreshList = () => {
    loadEmails(state.currentPage, state.filterToAddress, state.filterUnreadOnly);
    if (state.selectedEmailId) {
      selectEmail(state.selectedEmailId); // Refresh detail too
    }
  };

  const markAsRead = async (id: string, isRead: boolean) => {
    try {
      await updateEmailStatus(state.apiBaseUrl, state.apiSecret, id, isRead);
      // Optimistic update
      updateState({
        emails: state.emails.map(e => e.id === id ? { ...e, isRead } : e),
        selectedEmailDetail: state.selectedEmailDetail?.id === id ? { ...state.selectedEmailDetail, isRead } : state.selectedEmailDetail
      });
    } catch (err: any) {
      updateState({ error: err.message || 'Failed to update email status' });
    }
  };

  const removeEmail = async (id: string) => {
    try {
      await deleteEmail(state.apiBaseUrl, state.apiSecret, id);
      // Remove from list
      const newEmails = state.emails.filter(e => e.id !== id);
      const newTotal = Math.max(0, state.totalEmails - 1);
      
      let nextSelectedId = null;
      if (newEmails.length > 0) {
        // Find next email to select (try next in list, or previous)
        const idx = state.emails.findIndex(e => e.id === id);
        if (idx >= 0) {
          nextSelectedId = newEmails[idx] ? newEmails[idx].id : newEmails[newEmails.length - 1].id;
        }
      }
      
      updateState({ 
        emails: newEmails,
        totalEmails: newTotal,
        selectedEmailId: nextSelectedId,
        selectedEmailDetail: null // will be re-fetched if nextSelectedId exists
      });
      
      if (nextSelectedId) {
        selectEmail(nextSelectedId);
      }
    } catch (err: any) {
      updateState({ error: err.message || 'Failed to delete email' });
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login, logout, setPage, setFilters, selectEmail, refreshList, markAsRead, removeEmail, clearError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
