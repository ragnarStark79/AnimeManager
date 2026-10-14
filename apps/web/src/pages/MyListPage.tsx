import React from 'react';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import { EmptyState } from '../components/ui';
import './Placeholder.css';

export function MyListPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow"><Library size={13} aria-hidden="true" /> My List</p>
          <h1 className="placeholder-title">Collections</h1>
          <p className="placeholder-sub">Organise your library into custom folders and themes.</p>
        </div>
        <Link to="/my-list/new" className="btn btn--primary btn--md">
          <span aria-hidden="true">+</span>
          New Collection
        </Link>
      </div>

      <EmptyState
        icon={<Library size={36} strokeWidth={1.5} />}
        title="No collections yet"
        description="Create a custom collection to organise your anime, manga, and manhwa into themed folders."
        action={
          <Link to="/my-list/new" className="btn btn--primary btn--md">
            Create First Collection
          </Link>
        }
      />
    </div>
  );
}
