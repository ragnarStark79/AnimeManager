import React from 'react';
import { Settings, Info } from 'lucide-react';
import { GlassCard } from '../components/ui';
import './Placeholder.css';

const SETTINGS_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    description: 'Application preferences and display settings.',
    items: [
      { name: 'Appearance (Dark / Light / System)', status: 'Phase 05' },
      { name: 'Language and locale', status: 'Phase 05' },
      { name: 'Date format preference', status: 'Phase 05' },
    ],
  },
  {
    id: 'data',
    title: 'Data & Export',
    description: 'Export your library data or manage local storage.',
    items: [
      { name: 'Export library as JSON', status: 'Phase 05' },
      { name: 'Export library as CSV', status: 'Phase 05' },
      { name: 'Clear local application cache', status: 'Phase 05' },
    ],
  },
  {
    id: 'connections',
    title: 'Connections',
    description: 'External service status and backend connection information.',
    items: [
      { name: 'Backend API status', status: 'Phase 05' },
      { name: 'MyAnimeList (Jikan) connection', status: 'Phase 05' },
    ],
  },
];

export function SettingsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <Settings size={13} aria-hidden="true" /> Settings
          </p>
          <h1 className="placeholder-title">Settings</h1>
          <p className="placeholder-sub">
            Preferences, data management, and application configuration.
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="titles-demo-notice" role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          All settings features are planned for <strong>Phase 05</strong>. No
          options are functional in this phase — the panels below show the intended
          interface layout only.
        </span>
      </div>

      <div className="settings-grid">
        {SETTINGS_SECTIONS.map((section) => (
          <GlassCard key={section.id} padding="md">
            <h2 className="settings-section-title">{section.title}</h2>
            <p className="settings-section-desc">{section.description}</p>
            <ul className="settings-items" role="list">
              {section.items.map((item) => (
                <li key={item.name} className="settings-item">
                  <span>{item.name}</span>
                  <span className="settings-item-badge">Coming in {item.status}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
