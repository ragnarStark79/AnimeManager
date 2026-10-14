import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { EmptyState, Badge } from '../components/ui';
import './Placeholder.css';

const STATUS_TABS = [
  { id: 'all',             label: 'All' },
  { id: 'consuming',       label: 'In Progress' },
  { id: 'plan_to_consume', label: 'Plan to Watch/Read' },
  { id: 'completed',       label: 'Completed' },
  { id: 'on_hold',         label: 'On Hold' },
  { id: 'dropped',         label: 'Dropped' },
];

export function BookmarksPage() {
  const [activeTab, setActiveTab] = React.useState('all');

  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow"><Bookmark size={13} aria-hidden="true" /> Bookmarks</p>
          <h1 className="placeholder-title">Tracking</h1>
          <p className="placeholder-sub">Monitor your watch and read progress across all titles.</p>
        </div>
        <Link to="/titles/new" className="btn btn--primary btn--md">
          <span aria-hidden="true">+</span>
          Add Title
        </Link>
      </div>

      {/* Status tabs */}
      <nav className="placeholder-tabs" aria-label="Bookmark status filter">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={['placeholder-tab', activeTab === tab.id ? 'placeholder-tab--active' : ''].filter(Boolean).join(' ')}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            <Badge variant="default" size="sm">0</Badge>
          </button>
        ))}
      </nav>

      <EmptyState
        icon={<Bookmark size={36} strokeWidth={1.5} />}
        title="Nothing bookmarked yet"
        description="Start tracking titles by adding them to your library and setting a status like 'In Progress' or 'Plan to Watch'."
        action={
          <Link to="/titles/new" className="btn btn--primary btn--md">
            Add Your First Title
          </Link>
        }
      />
    </div>
  );
}
