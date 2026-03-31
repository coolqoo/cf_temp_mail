import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import './DetailPane.css';

const DetailPane: React.FC = () => {
  const { selectedEmailDetail, isLoadingDetail, markAsRead, removeEmail } = useAppContext();
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Reset local state when email changes
  useEffect(() => {
    setShowConfirmDelete(false);
    if (selectedEmailDetail) {
      // Default to text if HTML is missing
      setViewMode(selectedEmailDetail.htmlBody ? 'html' : 'text');
    }
  }, [selectedEmailDetail?.id, selectedEmailDetail?.htmlBody]);

  // Mark auto-read if currently unread, but wait, the spec says "Opening a mail should not automatically mark it read in the first version. Reason: explicit action is more predictable." So NO auto read.

  if (isLoadingDetail) {
    return (
      <div className="detail-pane loading">
        <div className="skeleton-header">
          <div className="skeleton-line title"></div>
          <div className="skeleton-line meta"></div>
          <div className="skeleton-line meta-short"></div>
        </div>
        <div className="skeleton-body">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
    );
  }

  if (!selectedEmailDetail) {
    return (
      <div className="detail-pane empty">
        <div className="empty-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon">
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
            <polyline points="3 7 12 13 21 7"></polyline>
          </svg>
          <p>Select an email to view details</p>
        </div>
      </div>
    );
  }

  const { id, subject, sender, toAddress, address, receivedAt, isRead, htmlBody, textBody } = selectedEmailDetail;

  const handleToggleRead = () => {
    markAsRead(id, !isRead);
  };

  const handleDelete = () => {
    if (showConfirmDelete) {
      removeEmail(id);
    } else {
      setShowConfirmDelete(true);
    }
  };

  return (
    <div className="detail-pane">
      <div className="detail-header">
        <div className="detail-header-main">
          <h2>{subject || '(no subject)'}</h2>
          
          <div className="metadata">
            <div className="meta-row">
              <span className="meta-label">From</span>
              <span className="meta-value copyable" onClick={() => navigator.clipboard.writeText(sender)} title="Copy sender">
                {sender}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">To</span>
              <span className="meta-value copyable" onClick={() => navigator.clipboard.writeText(toAddress || address)} title="Copy recipient">
                {toAddress || address}
              </span>
            </div>
            <div className="meta-row date">
              <span className="meta-value">
                {new Date(receivedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <button 
            className={`action-btn ${isRead ? '' : 'unread-state'}`} 
            onClick={handleToggleRead}
            title={isRead ? "Mark as unread" : "Mark as read"}
          >
            {isRead ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" fill="var(--accent-color)"></circle>
              </svg>
            )}
          </button>
          
          <div className="delete-container">
            {showConfirmDelete ? (
              <div className="confirm-delete">
                <span className="confirm-text">Delete?</span>
                <button className="confirm-btn cancel" onClick={() => setShowConfirmDelete(false)}>No</button>
                <button className="confirm-btn danger" onClick={handleDelete}>Yes</button>
              </div>
            ) : (
              <button className="action-btn danger-icon" onClick={handleDelete} title="Delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="content-tabs">
        <button 
          className={`tab-btn ${viewMode === 'html' ? 'active' : ''}`} 
          onClick={() => setViewMode('html')}
          disabled={!htmlBody}
        >
          HTML
        </button>
        <button 
          className={`tab-btn ${viewMode === 'text' ? 'active' : ''}`} 
          onClick={() => setViewMode('text')}
        >
          Text
        </button>
      </div>

      <div className="detail-body">
        {viewMode === 'html' && htmlBody ? (
          <iframe 
            className="html-viewer"
            srcDoc={htmlBody} 
            sandbox="allow-same-origin"
            title="Email HTML Content"
          />
        ) : (
          <div className="text-viewer">
            {textBody || 'No text content available.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPane;
