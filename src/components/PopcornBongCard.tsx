import React from 'react';
import { Popcorn } from 'lucide-react';

interface PopcornBongCardProps {
  className?: string;
  variant?: 'hero' | 'kiosk';
  onGoToKiosk?: () => void;
}

export const PopcornBongCard: React.FC<PopcornBongCardProps> = ({
  className = '',
  variant = 'kiosk',
  onGoToKiosk,
}) => {
  const showKioskLink = variant === 'hero' && Boolean(onGoToKiosk);

  return (
    <div
      id={`popcorn-card-info-${variant}`}
      className={`bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-artistic-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Popcorn className="w-3.5 h-3.5" />
            Gratis velkomstgave
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Gratis popcorn – hent i kiosken når du kommer inn!
          </h3>
        </div>
      </div>

      <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-5">
        De første 100 som kommer får gratis nypoppet popcorn. Gå til kiosken og si ifra til de som står der.
      </p>

      {showKioskLink && (
        <button
          id="btn-go-to-kiosk-popcorn"
          type="button"
          onClick={onGoToKiosk}
          className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-base uppercase tracking-wider rounded-xl shadow-artistic-md transition-all active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Popcorn className="w-5 h-5 text-zinc-950" />
          Gå til kiosken
        </button>
      )}
    </div>
  );
};
