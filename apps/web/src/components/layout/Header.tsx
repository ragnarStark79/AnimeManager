import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, Bell, Plus, User } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  title?: string;
}

const HEADER_NAV_LINKS = [
  { to: '/',            label: 'Dashboard',   end: true },
  { to: '/bookmarks',   label: 'Bookmarks' },
  { to: '/my-list',     label: 'My List' },
  { to: '/collections', label: 'Collections' },
  { to: '/titles',      label: 'Titles' },
];

export function Header({ title }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="header glass-header" role="banner">
      <div className="header-inner">
        {/* Page title */}
        {title && (
          <h1 className="header-title">{title}</h1>
        )}

        {/* Center pill navigation inspired by reference */}
        <nav className="header-nav-pill" aria-label="Primary routes">
          {HEADER_NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                ['header-nav-pill-item', isActive ? 'header-nav-pill-item--active' : ''].filter(Boolean).join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Search bar */}
        <div className={['header-search', searchOpen ? 'header-search--open' : ''].join(' ').trim()}>
          <div className="header-search-inner">
            <Search size={16} className="header-search-icon" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              className="header-search-input"
              placeholder="Search titles, genres, tags…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label="Search your library"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="header-actions">
          <Link
            to="/titles/new"
            className="header-btn header-btn--primary"
            aria-label="Add a new title"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="header-btn-label">Add</span>
          </Link>

          <button
            className="header-icon-btn"
            aria-label="Notifications"
            type="button"
          >
            <Bell size={18} aria-hidden="true" />
            <span className="header-icon-btn-dot" aria-hidden="true" />
          </button>

          <button
            className="header-avatar"
            aria-label="User account"
            type="button"
          >
            <User size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
