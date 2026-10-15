import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Library,
  FolderKanban,
  Star,
  ArrowRight,
  Plus,
  Zap,
  Flame,
  Clock,
  Sparkles,
  Clapperboard,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { GlassCard, PosterCard, Badge, AddTitleModal, FilterChips } from '../components/ui';
import {
  DEMO_TITLES,
  filterByMediaType,
  type MediaType,
} from '../data/demo';
import './Dashboard.css';

/* ── Category filter options (matching reference image aesthetic) ── */
type DashboardFilter = 'all' | MediaType | 'trending' | 'planning';

const FILTER_OPTIONS: { value: DashboardFilter; label: string; icon: LucideIcon }[] = [
  { value: 'all',      label: 'All Titles',    icon: Sparkles },
  { value: 'anime',    label: 'Anime',         icon: Clapperboard },
  { value: 'manga',    label: 'Manga',         icon: BookOpen },
  { value: 'manhwa',   label: 'Manhwa',        icon: Zap },
  { value: 'trending', label: 'Top Rated',     icon: Flame },
  { value: 'planning', label: 'Plan to Watch', icon: Clock },
];

/* ─────────────────────────────────────────────────────────── */

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all');
  const [addOpen, setAddOpen] = useState(false);

  const filterOptions = FILTER_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: <opt.icon size={14} />,
  }));

  const filteredPosters = useMemo(() => {
    switch (activeFilter) {
      case 'all':
        return DEMO_TITLES.slice(0, 6);
      case 'trending':
        return [...DEMO_TITLES].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6);
      case 'planning':
        return DEMO_TITLES.filter((t) => t.bookmarkStatus === 'plan_to_consume').slice(0, 6);
      default:
        return filterByMediaType(DEMO_TITLES, activeFilter as MediaType).slice(0, 6);
    }
  }, [activeFilter]);

  const sectionTitle =
    activeFilter === 'anime'    ? 'Anime in Sample Catalog' :
    activeFilter === 'manga'    ? 'Manga in Sample Catalog' :
    activeFilter === 'manhwa'   ? 'Manhwa in Sample Catalog' :
    activeFilter === 'trending' ? 'Top Rated (Sample Catalog)' :
    activeFilter === 'planning' ? 'Plan to Watch (Sample Catalog)' :
    'Sample Catalog';

  return (
    <div className="dashboard">
      {/* ── Page Header / Welcome ── */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Personal Media Library</p>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-sub">
            Your private sanctuary for tracking and discovering anime, manga, and manhwa.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn--primary btn--md"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Add Title</span>
          </button>
          <Link to="/import" className="btn btn--secondary btn--md">
            <Zap size={15} aria-hidden="true" />
            <span>Import from MAL</span>
          </Link>
        </div>
      </div>

      {/* ── Featured Hero Spotlight (Two cards side-by-side like reference image) ── */}
      <section className="dashboard-spotlight-grid" aria-label="Featured spotlights">
        {/* Spotlight Card 1: Anime */}
        <div className="spotlight-card spotlight-card--anime">
          <div className="spotlight-card-content">
            <div className="spotlight-badge-row">
              <Badge variant="anime" size="sm">Sample: Anime</Badge>
              <span className="spotlight-rating">
                <Star size={12} fill="currentColor" aria-hidden="true" />
                9.1
              </span>
            </div>
            <h2 className="spotlight-title">Fullmetal Alchemist: Brotherhood</h2>
            <p className="spotlight-desc">
              Two brothers search for the Philosopher's Stone after an attempt at human alchemy goes disastrously wrong.
            </p>
            <div className="spotlight-actions">
              <Link to="/titles" className="spotlight-btn spotlight-btn--play">
                <BookOpen size={14} aria-hidden="true" />
                <span>View in Catalog</span>
              </Link>
              <Link to="/bookmarks" className="spotlight-btn spotlight-btn--glass">
                <Bookmark size={14} aria-hidden="true" />
                <span>Bookmarks</span>
              </Link>
            </div>
          </div>
          <div className="spotlight-card-art spotlight-card-art--blue" aria-hidden="true">
            <div className="spotlight-orb spotlight-orb--blue" />
            <div className="spotlight-art-silhouette">ANIME</div>
          </div>
        </div>

        {/* Spotlight Card 2: Manhwa */}
        <div className="spotlight-card spotlight-card--manhwa">
          <div className="spotlight-card-content">
            <div className="spotlight-badge-row">
              <Badge variant="manhwa" size="sm">Sample: Manhwa</Badge>
              <span className="spotlight-rating">
                <Star size={12} fill="currentColor" aria-hidden="true" />
                8.9
              </span>
            </div>
            <h2 className="spotlight-title">Solo Leveling</h2>
            <p className="spotlight-desc">
              Sung Jin-woo rises from the weakest E-rank hunter to humanity's greatest hope after discovering a hidden quest.
            </p>
            <div className="spotlight-actions">
              <Link to="/titles" className="spotlight-btn spotlight-btn--play">
                <BookOpen size={14} aria-hidden="true" />
                <span>View in Catalog</span>
              </Link>
              <Link to="/collections" className="spotlight-btn spotlight-btn--glass">
                <FolderKanban size={14} aria-hidden="true" />
                <span>Collections</span>
              </Link>
            </div>
          </div>
          <div className="spotlight-card-art spotlight-card-art--lavender" aria-hidden="true">
            <div className="spotlight-orb spotlight-orb--purple" />
            <div className="spotlight-art-silhouette">MANHWA</div>
          </div>
        </div>
      </section>

      {/* ── Category Filter Pills Row ── */}
      <section className="dashboard-filter-section" aria-label="Media category filters">
        <FilterChips
          options={filterOptions}
          value={activeFilter}
          onChange={setActiveFilter}
          label="Filter catalog by category"
          className="filter-chips--scroll"
        />
      </section>

      {/* ── Demo notice ── */}
      <div className="dashboard-demo-notice" role="note">
        <Info size={13} aria-hidden="true" />
        <span>
          <strong>Sample catalog</strong> — The titles below are demonstration data.
          Your real library will appear here after backend connection in Phase 05.
        </span>
      </div>

      {/* ── Catalog Poster Grid ── */}
      <section className="dashboard-section" aria-labelledby="trending-heading">
        <div className="dashboard-section-header">
          <div>
            <div className="dashboard-section-eyebrow">
              <Flame size={14} aria-hidden="true" />
              <span>Catalog Showcase</span>
            </div>
            <h2 id="trending-heading" className="dashboard-section-title">
              {sectionTitle}
            </h2>
          </div>
          <div className="dashboard-section-actions">
            <Link to="/titles" className="dashboard-see-all">
              <span>View all catalog</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {filteredPosters.length > 0 ? (
          <div className="dashboard-poster-grid">
            {filteredPosters.map((item) => (
              <PosterCard
                key={item.titleId}
                titleId={item.titleId}
                title={item.title}
                mediaType={item.mediaType}
                coverUrl={item.coverUrl}
                year={item.year}
                rating={item.rating}
              />
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-filter">
            <p className="dashboard-empty-filter-msg">
              No sample titles in this category.
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--md"
              onClick={() => setActiveFilter('all')}
            >
              Show All
            </button>
          </div>
        )}
      </section>

      {/* ── Overview & Navigation Cards ── */}
      <section className="dashboard-section" aria-label="Library navigation">
        <div className="dashboard-nav-grid">
          <Link to="/bookmarks" className="dashboard-nav-card glass-interactive">
            <div className="dashboard-nav-card-icon dashboard-nav-card-icon--blue">
              <Bookmark size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-nav-card-content">
              <h3 className="dashboard-nav-card-title">Bookmarks & Progress</h3>
              <p className="dashboard-nav-card-sub">
                Track status across In Progress, Plan to Watch, Completed, and On Hold.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-nav-card-arrow" aria-hidden="true" />
          </Link>

          <Link to="/my-list" className="dashboard-nav-card glass-interactive">
            <div className="dashboard-nav-card-icon dashboard-nav-card-icon--purple">
              <Library size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-nav-card-content">
              <h3 className="dashboard-nav-card-title">My List</h3>
              <p className="dashboard-nav-card-sub">
                User-created lists and custom folders. Series can belong to multiple groups.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-nav-card-arrow" aria-hidden="true" />
          </Link>

          <Link to="/collections" className="dashboard-nav-card glass-interactive">
            <div className="dashboard-nav-card-icon dashboard-nav-card-icon--teal">
              <FolderKanban size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-nav-card-content">
              <h3 className="dashboard-nav-card-title">Collections</h3>
              <p className="dashboard-nav-card-sub">
                Themed collections, shared franchises, and multi-series curations.
              </p>
            </div>
            <ArrowRight size={16} className="dashboard-nav-card-arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Add Title Modal ── */}
      <AddTitleModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
