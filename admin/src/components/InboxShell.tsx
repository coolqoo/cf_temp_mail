import React, { useEffect, useState } from 'react';
import { useAppContext } from '../store';
import Sidebar from './Sidebar';
import DetailPane from './DetailPane';
import './InboxShell.css';

const InboxShell: React.FC = () => {
  const { 
    error, clearError, emails, isLoadingList, totalEmails, currentPage, pageSize,
    filterToAddress, filterUnreadOnly, setPage, setFilters, selectEmail, refreshList,
    selectedEmailId, isLoadingDetail
  } = useAppContext();

  const [localToAddress, setLocalToAddress] = useState(filterToAddress);
  const [localUnread, setLocalUnread] = useState(filterUnreadOnly);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearError();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearError]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters(localToAddress.trim(), localUnread);
  };

  const totalPages = Math.max(1, Math.ceil(totalEmails / pageSize));
  const isDrawerOpen = !!selectedEmailId || isLoadingDetail;

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className={`main-content ${isDrawerOpen ? 'drawer-open' : ''}`}>
        
        {/* Top Header Layer */}
        <header className="page-header">
          <div className="header-titles">
            <h1>Inbox Logs</h1>
            <p className="subtitle">Take a look at your recent temporary incoming emails</p>
          </div>
          <div className="header-actions">
            <button className="badge-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              Help
            </button>
            <button className="btn-primary" onClick={refreshList}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* Global Error Toast */}
        {error && (
          <div className="toast-error">
            <span>{error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Data Controls (Filter Row) */}
        <div className="data-controls">
          <form className="filter-form" onSubmit={handleApplyFilter}>
             <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by recipient..." 
                  value={localToAddress}
                  onChange={(e) => setLocalToAddress(e.target.value)}
                  onBlur={() => handleApplyFilter()}
                />
             </div>
             
             <label className="checkbox-filter">
                <input 
                  type="checkbox" 
                  checked={localUnread} 
                  onChange={(e) => {
                    setLocalUnread(e.target.checked);
                    setFilters(localToAddress.trim(), e.target.checked);
                  }}
                />
                <span>Unread Endpoints</span>
             </label>
          </form>

          {/* Pagination summary logic */}
          <div className="pagination-summary text-tertiary">
            Last {pageSize} days... wait, showing {Math.min((currentPage - 1) * pageSize + 1, totalEmails || 0)}–{Math.min(currentPage * pageSize, totalEmails)} of {totalEmails}
          </div>
        </div>

        {/* Table View */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>STATUS</th>
                <th style={{ width: '20%' }}>SENDER</th>
                <th style={{ width: '20%' }}>RECIPIENT URL</th>
                <th style={{ width: '32%' }}>SUBJECT</th>
                <th style={{ width: '12%' }}>TIME</th>
                <th style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList ? (
                 <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                 </tr>
              ) : emails.length === 0 ? (
                 <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>
                      No activity found.
                    </td>
                 </tr>
              ) : (
                emails.map((email) => (
                  <tr 
                    key={email.id} 
                    className={`t-row ${selectedEmailId === email.id ? 'active' : ''}`}
                    onClick={() => selectEmail(email.id)}
                  >
                    <td>
                      {email.isRead ? (
                        <span className="status-badge">READ</span>
                      ) : (
                        <span className="status-badge success">NEW</span>
                      )}
                    </td>
                    <td className="truncate" title={email.sender}>{email.sender}</td>
                    <td className="truncate text-secondary" title={email.toAddress || email.address}>{email.toAddress || email.address}</td>
                    <td className="truncate" style={{ fontWeight: email.isRead ? 'normal' : '500' }}>
                      {email.subject}
                    </td>
                    <td className="text-secondary text-sm">
                      {new Date(email.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} &nbsp;
                      {new Date(email.receivedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit'})}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="row-action-btn" onClick={(e) => { e.stopPropagation(); selectEmail(email.id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoadingList && totalEmails > 0 && (
          <div className="table-pagination">
            <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span className="text-tertiary">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
          </div>
        )}
      </main>

      {/* Slide-over Drawer for Details */}
      <DetailPane />
    </div>
  );
};

export default InboxShell;
