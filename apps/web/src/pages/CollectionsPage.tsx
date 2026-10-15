import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Sparkles, Info, X } from 'lucide-react';
import { EmptyState, GlassCard } from '../components/ui';
import './Placeholder.css';

const SUGGESTED_THEMES = [
  { id: 'favorites',  name: 'Favorites',          icon: '⭐',  desc: 'Your highest-rated and most memorable series.' },
  { id: 'airing',     name: 'Currently Airing',   icon: '📡',  desc: 'Seasonal anime with ongoing weekly episodes.' },
  { id: 'shonen',     name: 'Shōnen Classics',     icon: '⚡',  desc: 'Battle manga and legendary action series.' },
  { id: 'completed',  name: 'Hall of Fame',         icon: '🏆',  desc: 'Fully finished series you loved from start to end.' },
];

export function CollectionsPage() {
  const [newOpen, setNewOpen] = useState(false);

  // Close dialog on Escape key
  useEffect(() => {
    if (!newOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNewOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newOpen]);

  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <FolderKanban size={13} aria-hidden="true" /> Collections
          </p>
          <h1 className="placeholder-title">Custom Collections</h1>
          <p className="placeholder-sub">
            Organise anime, manga, and manhwa into user-curated groups, sagas, and
            thematic collections. A single title can belong to multiple collections
            simultaneously.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--md"
          onClick={() => setNewOpen(true)}
        >
          <Plus size={15} aria-hidden="true" />
          New Collection
        </button>
      </div>

      {/* Demo notice */}
      <div className="titles-demo-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>Ideas for collections</strong> — These suggestions are examples
          only. Full collection creation and management is a Phase 05 feature.
        </span>
      </div>

      {/* Suggested themes */}
      <section aria-label="Collection ideas">
        <p className="collections-suggestions-label">Suggested themes to get started</p>
        <div className="collections-suggestions">
          {SUGGESTED_THEMES.map((theme) => (
            <GlassCard key={theme.id} padding="md" className="collection-theme-card">
              <div className="collection-theme-header">
                <span className="collection-theme-emoji" aria-hidden="true">
                  {theme.icon}
                </span>
                <h3 className="collection-theme-title">{theme.name}</h3>
              </div>
              <p className="collection-theme-desc">{theme.desc}</p>
              <div className="collection-theme-footer">
                <span className="collection-theme-count">0 titles</span>
                <button
                  type="button"
                  className="collection-theme-create-btn"
                  aria-label={`Create collection: ${theme.name}`}
                  onClick={() => setNewOpen(true)}
                >
                  <Plus size={12} aria-hidden="true" />
                  Create
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <EmptyState
        icon={<FolderKanban size={36} strokeWidth={1.5} />}
        title="No custom collections yet"
        description="A single title can belong to multiple collections simultaneously. Collection creation with backend persistence is coming in Phase 05."
        action={
          <button
            type="button"
            className="btn btn--primary btn--md"
            onClick={() => setNewOpen(true)}
          >
            <Plus size={15} aria-hidden="true" />
            Create First Collection
          </button>
        }
      />

      {/* ── New Collection preview dialog ── */}
      {newOpen && (
        <div
          className="collections-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-col-heading"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewOpen(false);
          }}
        >
          <div className="collections-modal-panel">
            <div className="collections-modal-header">
              <h2 id="new-col-heading" className="collections-modal-title">New Collection</h2>
              <button
                type="button"
                className="add-title-close"
                aria-label="Close dialog"
                onClick={() => setNewOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="add-title-notice" role="note" style={{ margin: '0 0 var(--space-4)' }}>
              <Info size={15} aria-hidden="true" />
              <span>
                <strong>Preview — Phase 05 feature.</strong> Collection creation will
                be fully functional when the API is connected. This form shows the
                intended interface without saving data.
              </span>
            </div>
            <div className="collections-modal-form">
              <div className="input-group input-group--full">
                <label htmlFor="new-col-name" className="input-label">Collection Name</label>
                <div className="input-wrapper">
                  <input
                    id="new-col-name"
                    type="text"
                    className="input"
                    placeholder="e.g. Favorites, Shōnen Classics…"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>
              <div className="input-group input-group--full">
                <label htmlFor="new-col-desc" className="input-label">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <div className="input-wrapper">
                  <input
                    id="new-col-desc"
                    type="text"
                    className="input"
                    placeholder="What goes in this collection?"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="add-title-actions">
              <button type="button" className="btn btn--secondary btn--md" onClick={() => setNewOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary btn--md" disabled>
                Save Collection (Phase 05)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
