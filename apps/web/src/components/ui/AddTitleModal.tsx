import React, { useEffect, useRef } from 'react';
import { X, BookOpen, Info } from 'lucide-react';
import { Input } from './Input';
import './AddTitleModal.css';

interface AddTitleModalProps {
  open: boolean;
  onClose: () => void;
}

type MediaTypeValue = 'anime' | 'manga' | 'manhwa';

const MEDIA_OPTIONS: { value: MediaTypeValue; label: string }[] = [
  { value: 'anime',  label: 'Anime' },
  { value: 'manga',  label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
];

/**
 * AddTitleModal — UI-only preview of the future manual add form.
 *
 * This form does NOT persist data. When the API is wired in Phase 05, this
 * component will be replaced with a fully functional version. The notice
 * banner makes this clear to the user.
 */
export function AddTitleModal({ open, onClose }: AddTitleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Open/close native dialog element for accessible focus trapping
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      // Focus first focusable element
      requestAnimationFrame(() => firstInputRef.current?.focus());
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  // Close on Escape (native dialog handles this, but we sync state)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = () => onClose();
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="add-title-dialog"
      aria-labelledby="add-title-heading"
      onClick={handleBackdropClick}
    >
      <div className="add-title-panel">
        {/* Header */}
        <div className="add-title-header">
          <div className="add-title-header-left">
            <div className="add-title-icon" aria-hidden="true">
              <BookOpen size={18} />
            </div>
            <h2 id="add-title-heading" className="add-title-heading">
              Add Title Manually
            </h2>
          </div>
          <button
            type="button"
            className="add-title-close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview notice — makes the current state explicit */}
        <div className="add-title-notice" role="note">
          <Info size={15} aria-hidden="true" />
          <span>
            <strong>Preview form — Phase 05 feature.</strong> This form shows the
            planned interface for adding titles manually. Saving is not yet connected
            to the backend. Use{' '}
            <strong>Import from MAL</strong> for backend-persisted import.
          </span>
        </div>

        {/* Form body */}
        <form
          className="add-title-form"
          onSubmit={(e) => {
            e.preventDefault();
            // No persistence in Phase 04. Do not simulate success.
            onClose();
          }}
          noValidate
        >
          <Input
            ref={firstInputRef}
            id="add-title-display"
            label="Display Title"
            placeholder="e.g. Fullmetal Alchemist: Brotherhood"
            autoComplete="off"
            fullWidth
            required
          />

          <Input
            id="add-title-original"
            label="Original Title"
            placeholder="e.g. 鋼の錬金術師 (optional)"
            autoComplete="off"
            fullWidth
          />

          <div className="add-title-row">
            <div className="add-title-field">
              <label htmlFor="add-title-type" className="input-label">
                Media Type
              </label>
              <select
                id="add-title-type"
                className="add-title-select"
                defaultValue="anime"
                aria-label="Media type"
              >
                {MEDIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="add-title-year"
              label="Release Year"
              type="number"
              placeholder="e.g. 2009"
              min={1900}
              max={new Date().getFullYear() + 2}
              autoComplete="off"
            />
          </div>

          <Input
            id="add-title-cover"
            label="Cover Image URL"
            type="url"
            placeholder="https://example.com/cover.jpg (optional)"
            hint="A direct link to the cover artwork. Leave blank to use the generated placeholder."
            autoComplete="off"
            fullWidth
          />

          <div className="add-title-actions">
            <button type="button" className="btn btn--secondary btn--md" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--md" disabled>
              Save Title (Phase 05)
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
