import React from 'react';
import { Utensils, ShoppingBag, Smartphone } from 'lucide-react';
import { AppState, KioskItem } from '../types';
import { PopcornBongCard } from './PopcornBongCard';

interface KioskSectionProps {
  state: AppState;
}

export const getCleanItemPrice = (price: unknown): number => {
  if (typeof price === 'number') {
    return isNaN(price) ? 0 : Math.max(0, Math.floor(price));
  }
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
};

export const KioskSection: React.FC<KioskSectionProps> = ({ state }) => {
  const kioskItems = state.kioskItems || [];
  const settings = state.kioskSettings || {
    vippsNumber: '12345',
    vippsName: 'Lillesand United Kiosk',
    vippsUrl: '',
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-36 md:pb-24">
      <PopcornBongCard className="mb-8" variant="kiosk" />

      <div className="rounded-3xl p-4 sm:p-8 bg-zinc-900 border-2 border-zinc-800 shadow-artistic-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              Kioskmeny & Varmmat
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5">
              Se hva som selges i kiosken. Bestilling og betaling skjer i kiosken – ikke i appen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-zinc-950 text-amber-400 px-3.5 py-1.5 rounded-xl border-2 border-zinc-800 shadow-artistic-sm flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Vipps #{settings.vippsNumber || '12345'}
            </span>
          </div>
        </div>

        {kioskItems.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-800">
            <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-400">Ingen varer i kioskmenyen for øyeblikket.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {kioskItems.map((item: KioskItem) => {
              const isAvail = item.isAvailable ?? true;
              const cleanPrice = getCleanItemPrice(item.price);
              const priceDisplay = cleanPrice === 0 ? 'Gratis' : `${cleanPrice} kr`;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 shadow-artistic-sm ${
                    isAvail
                      ? 'bg-zinc-950 border-zinc-800'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 select-none">{item.icon || '🛒'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h4 className="font-black text-white text-sm">{item.name}</h4>
                          {!isAvail && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                              Utsolgt
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <p className="text-xs text-zinc-400 font-medium line-clamp-2 mt-0.5">
                            {item.desc}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono block">
                        {priceDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
