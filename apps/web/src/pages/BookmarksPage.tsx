import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Clock, CheckCircle, PauseCircle, XCircle, Info } from 'lucide-react';
import { EmptyState, PosterCard, FilterChips } from '../components/ui';
import {
  DEMO_TITLES,
  BOOKMARK_STATUS_LABELS,
  filterByBookmarkStatus,
  countByStatus,
  type BookmarkStatus,
} from '../data/demo';
import './BookmarksPage.css';

/* ── Tab definitions ── */
type TabId = 'all' | BookmarkStatus;

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'all',             label: 'All',              icon: <Bookmark size={14} /> },
  { id: 'consuming',       label: 'In Progress',      icon: <BookOpen size={14} /> },
  { id: 'plan_to_consume', label: 'Plan to Watch',    icon: <Clock size={14} /> },
  { id: 'completed',       label: 'Completed',        icon: <CheckCircle size={14} /> },
  { id: 'on_hold',         label: 'On Hold',          icon: <PauseCircle size={14} /> },
  { id: 'dropped',         label: 'Dropped',          icon: <XCircle size={14} /> },
];

/* ─────────────────────────────────────────────────────────── */

export function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const statusCounts = useMemo(() => countByStatus(DEMO_TITLES), []);

  const displayedTitles = useMemo(() => {
    if (activeTab === 'all') return DEMO_TITLES;
    return filterByBookmarkStatus(DEMO_TITLES, activeTab);
  }, [activeTab]);

  const tabOptions = TABS.map((tab) => ({
    value: tab.id,
    label: tab.label,
    icon:  tab.icon,
    count: tab.id === 'all' ? DEMO_TITLES.length : statusCounts[tab.id as BookmarkStatus],
  }));

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'All';

  return (
    <div className="bookmarks-page">
      {/* ── Page header ── */}
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <Bookmark size={13} aria-hidden="true" /> Bookmarks
          </p>
          <h1 className="placeholder-title">Tracking</h1>
          <p className="placeholder-sub">
            Monitor your watch and read progress across all titles. Bookmarks track
            status and progress independently of your collections.
          </p>
        </div>
        <Link to="/titles" className="btn btn--secondary btn--md">
          <BookOpen size={15} aria-hidden="true" />
          Browse Catalog
        </Link>
      </div>

      {/* ── Demo notice ── */}
      <div className="bookmarks-demo-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>Sample tracking data</strong> — Status values shown here are
          demonstration data. Real bookmark persistence is a Phase 05 feature.
        </span>
      </div>

      {/* ── Status filter chips ── */}
      <div className="bookmarks-tabs-wrap">
        <FilterChips
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          label="Filter by bookmark status"
          className="filter-chips--scroll"
        />
      </div>

      {/* ── Content ── */}
      {displayedTitles.length > 0 ? (
        <>
          <div className="bookmarks-section-label" aria-live="polite">
            <span>{activeLabel}</span>
            <span className="bookmarks-section-count">
              {displayedTitles.length} {displayedTitles.length === 1 ? 'title' : 'titles'}
            </span>
          </div>

          <div
            className="bookmarks-grid"
            role="list"
            aria-label={`${activeLabel} bookmarks`}
          >
            {displayedTitles.map((item) => (
              <div key={item.titleId} role="listitem">
                <PosterCard
                  titleId={item.titleId}
                  title={item.title}
                  mediaType={item.mediaType}
                  coverUrl={item.coverUrl}
                  year={item.year}
                  rating={item.rating}
                  status={
                    item.bookmarkStatus
                      ? BOOKMARK_STATUS_LABELS[item.bookmarkStatus]
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Bookmark size={36} strokeWidth={1.5} />}
          title={`Nothing in "${activeLabel}"`}
          description={
            activeTab === 'all'
              ? 'Start tracking titles by browsing the catalog and setting a status.'
              : `No titles with status "${BOOKMARK_STATUS_LABELS[activeTab as BookmarkStatus]}" in the sample dataset.`
          }
          action={
            activeTab === 'all' ? (
              <Link to="/titles" className="btn btn--primary btn--md">
                Browse Catalog
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--md"
                onClick={() => setActiveTab('all')}
              >
                Show All Bookmarks
              </button>
            )
          }
        />
      )}
    </div>
  );
}
