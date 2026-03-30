import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const {
    emails, isLoadingList, totalEmails, currentPage, pageSize,
    filterToAddress, filterUnreadOnly, selectedEmailId,
    setPage, setFilters, selectEmail, refreshList
  } = useAppContext();

  const [localToAddress, setLocalToAddress] = useState(filterToAddress);
  const [localUnread, setLocalUnread] = useState(filterUnreadOnly);

  // Sync back from global to local if they change outside
  useEffect(() => {
    setLocalToAddress(filterToAddress);
    setLocalUnread(filterUnreadOnly);
  }, [filterToAddress, filterUnreadOnly]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(localToAddress.trim(), localUnread);
  };

  const handleClearFilter = () => {
    setLocalToAddress('');
    setLocalUnread(false);
    setFilters('', false);
  };

  const totalPages = Math.max(1, Math.ceil(totalEmails / pageSize));

  return (
    <div className="sidebar">
      {/* Filter Header */}
      <div className="sidebar-header">
        <form className="filter-form" onSubmit={handleApplyFilter}>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Filter by recipient..."
              value={localToAddress}
              onChange={(e) => setLocalToAddress(e.target.value)}
              className="filter-input"
            />
            <button type="button" onClick={refreshList} className="icon-btn" title="Refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
          </div>
          
          <div className="filter-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localUnread}
                onChange={(e) => {
                  setLocalUnread(e.target.checked);
                  // Auto apply checkbox
                  setFilters(localToAddress.trim(), e.target.checked);
                }}
              />
              <span className="checkbox-text">Unread only</span>
            </label>
            
            <div className="filter-buttons">
              {(filterToAddress || filterUnreadOnly) && (
                <button type="button" onClick={handleClearFilter} className="text-btn clear-btn">
                  Clear
                </button>
              )}
              {localToAddress !== filterToAddress && (
                <button type="submit" className="text-btn apply-btn">
                  Apply
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* List Area */}
      <div className="list-area">
        {isLoadingList ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading messages...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <h3>No messages found</h3>
            <p>Try clearing filters or checking another address.</p>
          </div>
        ) : (
          <ul className="email-list">
            {emails.map((email) => (
              <li 
                key={email.id} 
                className={`email-row ${!email.isRead ? 'unread' : ''} ${selectedEmailId === email.id ? 'selected' : ''}`}
                onClick={() => selectEmail(email.id)}
              >
                <div className="row-header">
                  <div className="dot"></div>
                  <span className="sender text-ellipsis" title={email.sender}>{email.sender || 'Unknown Sender'}</span>
                  <span className="time">{new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="subject text-ellipsis" title={email.subject}>{email.subject}</div>
                <div className="recipient text-ellipsis">To: {email.toAddress || email.address}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoadingList && totalEmails > 0 && (
        <div className="pagination">
          <span className="page-info">
            {Math.min((currentPage - 1) * pageSize + 1, totalEmails)} – {Math.min(currentPage * pageSize, totalEmails)} of {totalEmails}
          </span>
          <div className="page-controls">
            <button 
              disabled={currentPage <= 1} 
              onClick={() => setPage(currentPage - 1)}
              className="icon-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setPage(currentPage + 1)}
              className="icon-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
