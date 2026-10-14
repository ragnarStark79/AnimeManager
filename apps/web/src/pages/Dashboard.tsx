import React, { useState } from 'react';
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
  Play,
  Flame,
  Clock,
  Sparkles,
  Clapperboard,
  SlidersHorizontal,
} from 'lucide-react';
import { GlassCard, PosterCard, Badge } from '../components/ui';
import './Dashboard.css';

/* ── Representative starter library posters ── */
const FEATURED_POSTERS = [
  { titleId: 'fma-brotherhood',  title: 'Fullmetal Alchemist: Brotherhood', mediaType: 'anime'  as const, year: 2009, rating: 9.1 },
  { titleId: 'vagabond',          title: 'Vagabond',                         mediaType: 'manga'  as const, year: 1998, rating: 9.3 },
  { titleId: 'solo-leveling',     title: 'Solo Leveling',                    mediaType: 'manhwa' as const, year: 2018, rating: 8.9 },
  { titleId: 'evangelion',        title: 'Neon Genesis Evangelion',          mediaType: 'anime'  as const, year: 1995, rating: 8.5 },
  { titleId: 'berserk',           title: 'Berserk',                          mediaType: 'manga'  as const, year: 1989, rating: 9.4 },
  { titleId: 'tower-of-god',      title: 'Tower of God',                     mediaType: 'manhwa' as const, year: 2010, rating: 8.3 },
];

/* ── Filter pills inspired by reference ── */
const FILTER_PILLS = [
  { id: 'all',      label: 'All Titles',   icon: Sparkles },
  { id: 'anime',    label: 'Anime',        icon: Clapperboard },
  { id: 'manga',    label: 'Manga',        icon: BookOpen },
  { id: 'manhwa',   label: 'Manhwa',       icon: Zap },
  { id: 'trending', label: 'Trending',     icon: Flame },
  { id: 'planning', label: 'Plan to Watch',icon: Clock },
];

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPosters = activeFilter === 'all' || activeFilter === 'trending' || activeFilter === 'planning'
    ? FEATURED_POSTERS
    : FEATURED_POSTERS.filter((p) => p.mediaType === activeFilter);

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
          <Link to="/titles/new" className="btn btn--primary btn--md">
            <Plus size={15} aria-hidden="true" />
            <span>Add Title</span>
          </Link>
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
              <Badge variant="anime" size="sm">Featured Anime</Badge>
              <span className="spotlight-rating">
                <Star size={12} fill="currentColor" aria-hidden="true" />
                9.1
              </span>
            </div>
            <h2 className="spotlight-title">Fullmetal Alchemist: Brotherhood</h2>
            <p className="spotlight-desc">
              Two brothers search for the Philosopher’s Stone after an attempt at human alchemy goes disastrously wrong.
            </p>
            <div className="spotlight-actions">
              <Link to="/titles/fma-brotherhood" className="spotlight-btn spotlight-btn--play">
                <Play size={14} fill="currentColor" aria-hidden="true" />
                <span>Resume Series</span>
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
              <Badge variant="manhwa" size="sm">Featured Manhwa</Badge>
              <span className="spotlight-rating">
                <Star size={12} fill="currentColor" aria-hidden="true" />
                8.9
              </span>
            </div>
            <h2 className="spotlight-title">Solo Leveling: Shadow Monarch</h2>
            <p className="spotlight-desc">
              Sung Jin-woo rises from the weakest E-rank hunter to humanity's greatest hope after discovering a hidden quest.
            </p>
            <div className="spotlight-actions">
              <Link to="/titles/solo-leveling" className="spotlight-btn spotlight-btn--play">
                <Play size={14} fill="currentColor" aria-hidden="true" />
                <span>Continue Reading</span>
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

      {/* ── Category Filter Pills Row (Reference Image Aesthetic) ── */}
      <section className="dashboard-filter-section" aria-label="Media category filters">
        <div className="filter-pills-container" role="tablist">
          {FILTER_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={['filter-pill', isActive ? 'filter-pill--active' : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveFilter(pill.id)}
              >
                <Icon size={14} className="filter-pill-icon" aria-hidden="true" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Trending & Catalog Poster Grid (Reference Image Layout) ── */}
      <section className="dashboard-section" aria-labelledby="trending-heading">
        <div className="dashboard-section-header">
          <div>
            <div className="dashboard-section-eyebrow">
              <Flame size={14} aria-hidden="true" />
              <span>Catalog Showcase</span>
            </div>
            <h2 id="trending-heading" className="dashboard-section-title">
              {activeFilter === 'anime' ? 'Trending in Anime' :
               activeFilter === 'manga' ? 'Trending in Manga' :
               activeFilter === 'manhwa' ? 'Trending in Manhwa' :
               'Trending in Library'}
            </h2>
          </div>
          <div className="dashboard-section-actions">
            <button className="dashboard-icon-pill" type="button" aria-label="Sort and filter options">
              <SlidersHorizontal size={14} aria-hidden="true" />
            </button>
            <Link to="/titles" className="dashboard-see-all">
              <span>View all catalog</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="dashboard-poster-grid">
          {filteredPosters.map((item) => (
            <PosterCard
              key={item.titleId}
              titleId={item.titleId}
              title={item.title}
              mediaType={item.mediaType}
              year={item.year}
              rating={item.rating}
            />
          ))}
        </div>
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
                Track status across Consuming, Plan to Watch, Completed, and On Hold.
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
    </div>
  );
}
