import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Key,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../components/ui';
import { api, type ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import './Placeholder.css';

/* Phase 05 Full-Stack Integration. (Historical note: No options are functional in this phase prior to Phase 05). */
export function SettingsPage() {
  const queryClient = useQueryClient();
  const { token, ownerId, email, setToken, logout } = useAuth();

  const [customToken, setCustomToken] = useState(token || '');
  const [tokenSavedMsg, setTokenSavedMsg] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Check health and backend connectivity
  const {
    data: healthData,
    isLoading: isCheckingHealth,
    refetch: checkHealth,
  } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/v1/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const handleExportJson = async () => {
    try {
      setExportError(null);
      setExportSuccessMsg('Generating JSON backup...');
      const data = await api.export.getJson();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animemanager_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccessMsg('JSON backup downloaded successfully.');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export JSON');
      setExportSuccessMsg(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportError(null);
      setExportSuccessMsg('Generating CSV export...');
      const csv = await api.export.getCsv();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([csv], {
        type: 'text/csv; charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animemanager_titles_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccessMsg('CSV catalog downloaded successfully.');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export CSV');
      setExportSuccessMsg(null);
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    setExportSuccessMsg('Client query cache cleared.');
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    setToken(customToken.trim() || null);
    setTokenSavedMsg(true);
    setTimeout(() => setTokenSavedMsg(false), 3000);
  };

  return (
    <div className="placeholder-page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="placeholder-page-header">
        <div>
          <p className="placeholder-eyebrow">
            <Settings size={13} aria-hidden="true" /> Settings
          </p>
          <h1 className="placeholder-title">Settings & Data Management</h1>
          <p className="placeholder-sub">
            Manage your personal media library data, export backups, and inspect service connections.
          </p>
        </div>
      </div>

      {exportSuccessMsg && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {exportError && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <AlertCircle size={16} />
          <span>{exportError}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* ── Section 1: Data & Backups ── */}
        <GlassCard padding="md">
          <h2 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Download size={18} />
            Data Export & Backup
          </h2>
          <p className="settings-section-desc">
            Export your complete personal catalog, custom collections, and tracking bookmarks. Data remains strictly user-owned.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Full JSON Backup</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Complete relational archive including aliases, genres, tags, collections, and external MAL IDs.
                </p>
              </div>
              <Button variant="secondary" size="sm" iconLeft={<Download size={14} />} onClick={handleExportJson}>
                Export JSON
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Tabular CSV Export</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Spreadsheet-compatible export with media types, episode/chapter progress, ratings, and collection lists.
                </p>
              </div>
              <Button variant="secondary" size="sm" iconLeft={<Download size={14} />} onClick={handleExportCsv}>
                Export CSV
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Local Query Cache</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Reset in-memory browser cache to refetch fresh data from the server.
                </p>
              </div>
              <Button variant="ghost" size="sm" iconLeft={<RefreshCw size={14} />} onClick={handleClearCache}>
                Clear Cache
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* ── Section 2: Session & Authentication ── */}
        <GlassCard padding="md">
          <h2 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Key size={18} />
            Authentication & Owner Session
          </h2>
          <p className="settings-section-desc">
            The API enforces strict owner-scoped authorization via cryptographic JWT tokens.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Active Owner UUID</span>
                <Badge variant="primary" size="sm">Authenticated</Badge>
              </div>
              <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                {ownerId || 'Not authenticated'}
              </code>
              {email && (
                <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Email: {email}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveToken} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label htmlFor="custom-token-input" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Bearer JWT Token (Local Storage)
              </label>
              <textarea
                id="custom-token-input"
                rows={2}
                className="title-tracking-input"
                style={{ fontSize: '11px', fontFamily: 'monospace' }}
                placeholder="Paste your Supabase JWT session token here..."
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                <Button variant="secondary" size="sm" type="submit">
                  Save Token
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => { setCustomToken(''); logout(); }}>
                  Clear Token
                </Button>
                {tokenSavedMsg && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: '#34d399', alignSelf: 'center' }}>
                    Token updated!
                  </span>
                )}
              </div>
            </form>
          </div>
        </GlassCard>

        {/* ── Section 3: System Status & Infrastructure ── */}
        <GlassCard padding="md">
          <h2 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database size={18} />
            System Connections & Infrastructure
          </h2>
          <p className="settings-section-desc">
            Status of backend services, PostgreSQL database, and media storage pipelines.
          </p>

          <ul className="settings-items" role="list" style={{ marginTop: 'var(--space-4)' }}>
            <li className="settings-item">
              <div>
                <strong>Express REST API & PostgreSQL</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Endpoints, Zod schema validation, transaction boundaries.
                </p>
              </div>
              <span className="settings-item-badge" style={{ color: '#34d399', borderColor: '#059669' }}>
                {isCheckingHealth ? 'Checking...' : healthData?.data?.database === 'connected' ? 'Connected & Healthy' : 'Online'}
              </span>
            </li>

            <li className="settings-item">
              <div>
                <strong>Jikan v4 Metadata Importer</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Resilient adapter with 3 req/s throttling and bounded caching.
                </p>
              </div>
              <span className="settings-item-badge" style={{ color: '#34d399', borderColor: '#059669' }}>
                Operational
              </span>
            </li>

            <li className="settings-item">
              <div>
                <strong>Supabase Storage (Cover Uploads)</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Requires &lsquo;covers&rsquo; bucket provisioned on Supabase with owner RLS policies. Direct URLs are fully supported.
                </p>
              </div>
              <span className="settings-item-badge" style={{ color: '#fbbf24', borderColor: '#d97706' }}>
                Setup Required for Uploads
              </span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
