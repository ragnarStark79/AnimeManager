import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Sparkles } from 'lucide-react';
import { EmptyState, GlassCard } from '../components/ui';
import './Placeholder.css';

const SAMPLE_COLLECTION_THEMES = [
  { name: 'Favorites', count: 0, desc: 'Highest rated and most memorable series' },
  { name: 'Currently Airing', count: 0, desc: 'Seasonal anime with ongoing weekly episodes' },
  { name: 'Shonen Classics', count: 0, desc: 'Battle manga and legendary action series' },
];

export function CollectionsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <FolderKanban size={13} aria-hidden="true" /> Collections
          </p>
          <h1 className="placeholder-title">Custom Collections</h1>
          <p className="placeholder-sub">
            Organise anime, manga, and manhwa into user-curated groups, sagas, and thematic collections.
          </p>
        </div>
        <Link to="/collections/new" className="btn btn--primary btn--md">
          <Plus size={15} aria-hidden="true" />
          <span>New Collection</span>
        </Link>
      </div>

      {/* Suggested collections preview */}
      <div className="collections-suggestions" aria-label="Suggested collection themes">
        {SAMPLE_COLLECTION_THEMES.map((theme) => (
          <GlassCard key={theme.name} padding="md" className="collection-theme-card">
            <div className="collection-theme-header">
              <span className="collection-theme-icon" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <h3 className="collection-theme-title">{theme.name}</h3>
            </div>
            <p className="collection-theme-desc">{theme.desc}</p>
            <div className="collection-theme-footer">
              <span className="collection-theme-count">{theme.count} titles</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <EmptyState
        icon={<FolderKanban size={36} strokeWidth={1.5} />}
        title="No custom collections yet"
        description="A single title can belong to multiple collections simultaneously. Create your first collection to group your favorite series."
        action={
          <Link to="/collections/new" className="btn btn--primary btn--md">
            Create First Collection
          </Link>
        }
      />
    </div>
  );
}
