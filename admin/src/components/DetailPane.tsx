import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import './DetailPane.css';

const DetailPane: React.FC = () => {
  const { selectedEmailId, selectedEmailDetail, isLoadingDetail, markAsRead, removeEmail, selectEmail } = useAppContext();
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setShowConfirmDelete(false);
    if (selectedEmailDetail) {
      setViewMode(selectedEmailDetail.htmlBody ? 'html' : 'text');
    }
  }, [selectedEmailDetail?.id, selectedEmailDetail?.htmlBody]);

  const isOpen = !!selectedEmailId || isLoadingDetail;

  const handleClose = () => {
    selectEmail(null);
  };

  const handleToggleRead = () => {
    if (selectedEmailDetail) {
      markAsRead(selectedEmailDetail.id, !selectedEmailDetail.isRead);
    }
  };

  const handleDelete = () => {
    if (showConfirmDelete && selectedEmailDetail) {
      removeEmail(selectedEmailDetail.id);
    } else {
      setShowConfirmDelete(true);
    }
  };

  return (
    <>
      <div className={`drawer-pane ${isOpen ? 'open' : ''}`}>
        
        {/* Drawer Header with Close Button */}
        <div className="drawer-actions-bar">
           <button className="close-btn" onClick={handleClose} title="Close">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
           </button>
        </div>

        {/* Content Region */}
        {isLoadingDetail ? (
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
        ) : !selectedEmailDetail ? (
          <div className="detail-pane empty">
            {/* Should not typically show because drawer is closed, but just in case */}
          </div>
        ) : (
          <div className="drawer-content">
            <div className="detail-header">
              <div className="detail-header-main">
                <h2>{selectedEmailDetail.subject || '(no subject)'}</h2>
                
                <div className="metadata">
                  <div className="meta-row">
                    <span className="meta-label">From</span>
                    <span className="meta-value copyable" onClick={() => navigator.clipboard.writeText(selectedEmailDetail.sender)} title="Copy sender">
                      {selectedEmailDetail.sender}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">To</span>
                    <span className="meta-value copyable" onClick={() => navigator.clipboard.writeText(selectedEmailDetail.toAddress || selectedEmailDetail.address)} title="Copy recipient">
                      {selectedEmailDetail.toAddress || selectedEmailDetail.address}
                    </span>
                  </div>
                  <div className="meta-row date">
                    <span className="meta-value text-tertiary">
                      {new Date(selectedEmailDetail.receivedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className={`action-btn ${selectedEmailDetail.isRead ? '' : 'unread-state'}`} 
                  onClick={handleToggleRead}
                  title={selectedEmailDetail.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {selectedEmailDetail.isRead ? (
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
                disabled={!selectedEmailDetail.htmlBody}
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
              {viewMode === 'html' && selectedEmailDetail.htmlBody ? (
                <iframe 
                  className="html-viewer"
                  srcDoc={selectedEmailDetail.htmlBody} 
                  sandbox="allow-same-origin"
                  title="Email HTML Content"
                />
              ) : (
                <div className="text-viewer">
                  {selectedEmailDetail.textBody || 'No text content available.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetailPane;
