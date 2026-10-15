import React from 'react';
import { Zap, Search, Info } from 'lucide-react';
import { EmptyState, Input } from '../components/ui';
import './Placeholder.css';

export function ImportPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow"><Zap size={13} aria-hidden="true" /> Import</p>
          <h1 className="placeholder-title">Import from MAL</h1>
          <p className="placeholder-sub">Search MyAnimeList and import metadata into your library with a preview before saving.</p>
        </div>
      </div>

      {/* Demo / Phase 05 notice */}
      <div className="titles-demo-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>Import preview</strong> — The backend Jikan adapter and validation
          pipeline were implemented in Phase 03. Full interactive searching, preview,
          and persistence will be connected in <strong>Phase 05</strong>. No data is
          saved or queried from this page in Phase 04.
        </span>
      </div>

      <div className="placeholder-import-search">
        <Input
          type="search"
          placeholder="Search MyAnimeList or paste a URL…"
          iconLeft={<Search size={16} />}
          fullWidth
          aria-label="Search MyAnimeList for import"
          hint="Try searching by title name or paste a MyAnimeList URL directly."
        />
        <button
          type="button"
          className="btn btn--primary btn--md"
          disabled
          title="Search will be connected in Phase 05"
          style={{ flexShrink: 0, height: 40, alignSelf: 'flex-start' }}
        >
          <Zap size={15} aria-hidden="true" />
          Search (Phase 05)
        </button>
      </div>

      <EmptyState
        icon={<Zap size={36} strokeWidth={1.5} />}
        title="Ready to import"
        description="Search for a title above to preview its metadata. You'll be able to review and edit all fields before saving to your library once connected in Phase 05."
      />
    </div>
  );
}
