import React from 'react';
import { Settings } from 'lucide-react';
import { GlassCard } from '../components/ui';
import './Placeholder.css';

const SETTINGS_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    description: 'Application preferences and display settings.',
    items: ['Appearance', 'Language', 'Date format'],
  },
  {
    id: 'data',
    title: 'Data & Export',
    description: 'Export your library data or manage storage.',
    items: ['Export as JSON', 'Export as CSV', 'Clear cache'],
  },
  {
    id: 'api',
    title: 'Connections',
    description: 'API keys, external service configurations.',
    items: ['Backend health check', 'MAL connection status'],
  },
];

export function SettingsPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow"><Settings size={13} /> Settings</p>
          <h1 className="placeholder-title">Settings</h1>
          <p className="placeholder-sub">Preferences, data management, and application configuration.</p>
        </div>
      </div>

      <div className="settings-grid">
        {SETTINGS_SECTIONS.map((section) => (
          <GlassCard key={section.id} padding="md">
            <h2 className="settings-section-title">{section.title}</h2>
            <p className="settings-section-desc">{section.description}</p>
            <ul className="settings-items" role="list">
              {section.items.map((item) => (
                <li key={item} className="settings-item">
                  <span>{item}</span>
                  <span className="settings-item-badge">Coming in Phase 05</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
