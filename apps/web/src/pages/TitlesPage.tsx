import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { EmptyState, Input } from '../components/ui';
import './Placeholder.css';

export function TitlesPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow"><BookOpen size={13} aria-hidden="true" /> Titles</p>
          <h1 className="placeholder-title">All Titles</h1>
          <p className="placeholder-sub">Browse, search, and manage your complete title catalog.</p>
        </div>
        <Link to="/titles/new" className="btn btn--primary btn--md">
          <span aria-hidden="true">+</span>
          Add Title
        </Link>
      </div>

      <Input
        type="search"
        placeholder="Search titles…"
        iconLeft={<Search size={16} />}
        fullWidth
        aria-label="Search all titles"
      />

      <EmptyState
        icon={<BookOpen size={36} strokeWidth={1.5} />}
        title="Your catalog is empty"
        description="Add your first anime, manga, or manhwa manually or import from MyAnimeList."
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/titles/new" className="btn btn--primary btn--md">Add Manually</Link>
            <Link to="/import" className="btn btn--secondary btn--md">Import from MAL</Link>
          </div>
        }
      />
    </div>
  );
}
