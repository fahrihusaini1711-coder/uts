import React, { useEffect } from 'react';
import { Download, FileText, X } from 'lucide-react';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  imageUrl?: string;
  fileName?: string;
  note?: string;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  imageUrl,
  fileName,
  note,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const isImage = imageUrl.startsWith('data:image/');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Lampiran Struk"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {fileName || 'Lampiran Struk Transaksi'}
            </h3>
            {note && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {note}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={imageUrl}
              download={fileName || 'struk-transaksi'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup lampiran"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
          {isImage ? (
            <img
              src={imageUrl}
              alt={fileName || 'Bukti struk transaksi'}
              className="max-w-full max-h-[60vh] rounded-lg object-contain border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="text-center py-10 px-6">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {fileName || 'Dokumen lampiran'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pratinjau langsung tidak tersedia untuk format berkas ini. Silakan klik tombol Unduh.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
