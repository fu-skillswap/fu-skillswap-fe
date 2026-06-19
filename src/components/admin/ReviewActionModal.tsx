// =====================================================================
// src/components/admin/ReviewActionModal.tsx — Review Action Modal
// =====================================================================
"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

type ActionType = "APPROVE" | "REJECT" | "REQUEST_REVISION" | null;

interface ReviewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
  actionType: ActionType;
  isLoading: boolean;
}

export default function ReviewActionModal({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  isLoading,
}: ReviewActionModalProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen && note !== "") {
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const isNoteRequired = actionType === "REJECT" || actionType === "REQUEST_REVISION";
    const trimmedNote = note.trim();

    if (isNoteRequired && trimmedNote.length === 0) {
      return;
    }

    if (isLoading) {
      return;
    }

    onSubmit(trimmedNote);
  };

  const isNoteRequired = actionType === "REJECT" || actionType === "REQUEST_REVISION";
  const isConfirmDisabled = isLoading || (isNoteRequired && note.trim().length === 0);

  if (!isOpen || !actionType) {
    return null;
  }

  const getActionLabel = () => {
    switch (actionType) {
      case "APPROVE":
        return "Approve Request";
      case "REJECT":
        return "Reject Request";
      case "REQUEST_REVISION":
        return "Request Revision";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <h3 className="text-lg font-bold font-serif text-brand-text">
              {getActionLabel()}
            </h3>
            <p className="text-brand-text-muted text-body font-semibold mt-0.5">
              {isNoteRequired
                ? "Please provide a note for this action."
                : "Optional: Add a note for this action."}
            </p>
          </div>

          <div>
            <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">
              {isNoteRequired ? "Note (Required)" : "Note (Optional)"}
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              placeholder={
                actionType === "APPROVE"
                  ? "Add any additional comments..."
                  : actionType === "REJECT"
                  ? "Please explain why this request is being rejected..."
                  : "Please specify what needs to be revised..."
              }
              className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-terracotta resize-none placeholder-brand-grey font-medium disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-field border border-brand-border text-body font-bold text-brand-text hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConfirmDisabled}
              className={`flex-1 px-4 py-2 rounded-field text-body font-bold text-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionType === "REJECT"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-brand-terracotta hover:bg-brand-terracotta-hover"
              }`}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}