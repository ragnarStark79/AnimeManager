import React from 'react';
import { Link } from 'react-router-dom';
import { Library, FolderKanban, ArrowRight, Info } from 'lucide-react';
import { EmptyState, GlassCard } from '../components/ui';
import './Placeholder.css';

export function MyListPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <Library size={13} aria-hidden="true" /> My List
          </p>
          <h1 className="placeholder-title">My List</h1>
          <p className="placeholder-sub">
            Your personal organization area. Group anime, manga, and manhwa into
            custom collections and themed folders. A single title can belong to
            multiple collections simultaneously.
          </p>
        </div>
        <Link to="/collections" className="btn btn--primary btn--md">
          <FolderKanban size={15} aria-hidden="true" />
          Manage Collections
        </Link>
      </div>

      {/* Distinction notice */}
      <div className="mylist-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>My List vs. Bookmarks:</strong> My List is your organizational
          system — folders and groupings. Bookmarks track your watch/read status
          and progress. They are independent and serve different purposes.
        </span>
      </div>

      {/* Navigation card to Collections */}
      <GlassCard padding="md" className="mylist-nav-card">
        <div className="mylist-nav-card-inner">
          <div className="mylist-nav-icon" aria-hidden="true">
            <FolderKanban size={24} />
          </div>
          <div className="mylist-nav-content">
            <h2 className="mylist-nav-title">Collections</h2>
            <p className="mylist-nav-desc">
              Create and manage themed collections, curated groupings, and series
              sagas. Your real collections will live here.
            </p>
          </div>
          <Link
            to="/collections"
            className="mylist-nav-link"
            aria-label="Go to Collections page"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </GlassCard>

      <EmptyState
        icon={<Library size={36} strokeWidth={1.5} />}
        title="No collections yet"
        description="Create a custom collection to organise your anime, manga, and manhwa into themed folders. Collections support multi-title membership."
        action={
          <Link to="/collections" className="btn btn--primary btn--md">
            Create First Collection
          </Link>
        }
      />
    </div>
  );
}
