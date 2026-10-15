import React, { useState, useMemo, useCallback, useId, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  X,
  Zap,
  Info,
} from 'lucide-react';
import {
  EmptyState,
  FilterChips,
  SortControl,
  AddTitleModal,
  PosterCard,
} from '../components/ui';
import {
  DEMO_TITLES,
  DEMO_MEDIA_TYPES,
  filterByMediaType,
  searchTitles,
  sortTitles,
  type MediaType,
  type SortKey,
} from '../data/demo';
import './TitlesPage.css';

/* ─────────────────────────────────────────────────────────── */

type MediaFilter = MediaType | 'all';

const FILTER_OPTIONS: { value: MediaFilter; label: string }[] = [
  { value: 'all',    label: 'All' },
  ...DEMO_MEDIA_TYPES.map((t) => ({ value: t as MediaFilter, label: t.charAt(0).toUpperCase() + t.slice(1) })),
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'title-asc',    label: 'Title A–Z' },
  { value: 'title-desc',   label: 'Title Z–A' },
  { value: 'rating-desc',  label: 'Top Rated' },
  { value: 'rating-asc',   label: 'Lowest Rated' },
  { value: 'year-desc',    label: 'Newest First' },
  { value: 'year-asc',     label: 'Oldest First' },
];

/* ─────────────────────────────────────────────────────────── */

export function TitlesPage() {
  const searchId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [query, setQuery]           = useState(urlQuery);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [sort, setSort]             = useState<SortKey>('title-asc');
  const [addOpen, setAddOpen]       = useState(false);

  // Synchronize local search state when URL search params change
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val.trim()) {
        next.set('q', val);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  };

  const results = useMemo(() => {
    const byType = filterByMediaType(
      DEMO_TITLES,
      mediaFilter === 'all' ? null : mediaFilter,
    );
    const searched = searchTitles(byType, query);
    return sortTitles(searched, sort);
  }, [query, mediaFilter, sort]);

  const hasQuery  = query.trim().length > 0;
  const hasFilter = mediaFilter !== 'all';

  return (
    <div className="titles-page">
      {/* ── Page header ── */}
      <div className="titles-header">
        <div>
          <p className="placeholder-eyebrow">
            <BookOpen size={13} aria-hidden="true" /> Titles
          </p>
          <h1 className="placeholder-title">All Titles</h1>
          <p className="placeholder-sub">
            Browse, search, and manage your complete title catalog.
          </p>
        </div>
        <div className="titles-header-actions">
          <button
            type="button"
            className="btn btn--primary btn--md"
            onClick={() => setAddOpen(true)}
          >
            <span aria-hidden="true">+</span>
            Add Title
          </button>
          <Link to="/import" className="btn btn--secondary btn--md">
            <Zap size={15} aria-hidden="true" />
            Import from MAL
          </Link>
        </div>
      </div>

      {/* ── Demo notice ── */}
      <div className="titles-demo-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>Sample catalog</strong> — These {DEMO_TITLES.length} titles are
          demonstration data. Your real library will appear here after backend
          connection in Phase 05.
        </span>
      </div>

      {/* ── Search + Controls bar ── */}
      <div className="titles-controls">
        <div className="titles-search-wrap">
          <label htmlFor={searchId} className="sr-only">
            Search titles
          </label>
          <div className="titles-search-inner">
            <Search size={16} className="titles-search-icon" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              className="titles-search-input"
              placeholder="Search by title, genre…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (query) {
                    handleClear();
                  } else {
                    e.currentTarget.blur();
                  }
                }
              }}
              autoComplete="off"
              spellCheck={false}
              aria-label="Search titles"
            />
            {hasQuery && (
              <button
                type="button"
                className="titles-search-clear"
                aria-label="Clear search"
                onClick={handleClear}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="titles-controls-right">
          <FilterChips
            options={FILTER_OPTIONS}
            value={mediaFilter}
            onChange={setMediaFilter}
            label="Filter by media type"
            className="filter-chips--scroll"
          />
          <SortControl
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            label="Sort titles"
          />
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="titles-results-meta" aria-live="polite" aria-atomic="true">
        {hasQuery || hasFilter ? (
          <span className="titles-results-count">
            {results.length === 0
              ? 'No results'
              : `${results.length} of ${DEMO_TITLES.length} titles`}
          </span>
        ) : (
          <span className="titles-results-count">
            {DEMO_TITLES.length} titles (sample catalog)
          </span>
        )}
        {(hasQuery || hasFilter) && (
          <button
            type="button"
            className="titles-reset-btn"
            onClick={() => {
              handleClear();
              setMediaFilter('all');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Catalog grid or empty state ── */}
      {results.length > 0 ? (
        <div className="titles-grid" role="list" aria-label="Title catalog">
          {results.map((item) => (
            <div key={item.titleId} role="listitem">
              <PosterCard
                titleId={item.titleId}
                title={item.title}
                mediaType={item.mediaType}
                coverUrl={item.coverUrl}
                year={item.year}
                rating={item.rating}
              />
            </div>
          ))}
        </div>
      ) : hasQuery ? (
        <EmptyState
          icon={<Search size={36} strokeWidth={1.5} />}
          title="No results found"
          description={`No titles matched "${query}". Try a different search term or clear the filter.`}
          action={
            <button type="button" className="btn btn--secondary btn--md" onClick={handleClear}>
              Clear Search
            </button>
          }
        />
      ) : (
        <EmptyState
          icon={<BookOpen size={36} strokeWidth={1.5} />}
          title="Your catalog is empty"
          description="Add your first anime, manga, or manhwa manually or import from MyAnimeList."
          action={
            <div className="titles-empty-actions">
              <button
                type="button"
                className="btn btn--primary btn--md"
                onClick={() => setAddOpen(true)}
              >
                Add Manually
              </button>
              <Link to="/import" className="btn btn--secondary btn--md">
                Import from MAL
              </Link>
            </div>
          }
        />
      )}

      {/* ── Add Title Modal ── */}
      <AddTitleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
