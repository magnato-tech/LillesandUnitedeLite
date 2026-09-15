import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { AppState, Person, KioskItem } from '../types';
import { PopcornBongCard } from './PopcornBongCard';

interface KioskSectionProps {
  state: AppState;
  onClaimPopcorn?: () => void;
  myPlayerName?: string | null;
  onBongClaimed?: () => void;
  activePersonId?: string | null;
  activePerson?: Person | null;
  onCreatePerson?: (firstName: string) => Promise<Person | null>;
  onGoToProfile?: () => void;
}

// Helper to safely parse item price regardless of legacy string or number format
export const getCleanItemPrice = (price: any): number => {
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

export const KioskSection: React.FC<KioskSectionProps> = ({
  state,
  myPlayerName,
  onBongClaimed,
  activePersonId = null,
  activePerson = null,
  onCreatePerson,
  onGoToProfile,
}) => {
  const kioskItems = state.kioskItems || [];
  const settings = state.kioskSettings || {
    vippsNumber: '12345',
    vippsName: 'Lillesand United Kiosk',
    vippsUrl: '',
  };

  // Cart state: itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showVippsModal, setShowVippsModal] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Calculate totals strictly with robust number sanitization
  const cartEntries = Object.entries(cart)
    .map(([id, qty]) => {
      const item = kioskItems.find((k) => k.id === id);
      return item ? { item, qty } : null;
    })
    .filter((e): e is { item: KioskItem; qty: number } => e !== null);

  const totalItemsCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);
  const totalAmount = cartEntries.reduce((sum, e) => {
    const p = getCleanItemPrice(e.item.price);
    return sum + p * e.qty;
  }, 0);

  // Safe clipboard helper with execCommand fallback
  const safeCopy = (text: string, onSuccess: () => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
          fallbackCopy(text, onSuccess);
        });
      } else {
        fallbackCopy(text, onSuccess);
      }
    } catch {
      fallbackCopy(text, onSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onSuccess();
    } catch {
      // Visible on screen fallback
    }
  };

  const handleCopyAmount = () => {
    safeCopy(String(totalAmount), () => {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2500);
    });
  };

  const handleCopyNumber = () => {
    safeCopy(settings.vippsNumber || '12345', () => {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2500);
    });
  };

  const handleOpenVipps = () => {
    if (settings.vippsUrl && settings.vippsUrl.trim()) {
      window.open(settings.vippsUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = 'vipps://';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-36 md:pb-24">
      {/* Popcorn Bong Card */}
      <PopcornBongCard
        popcorn={state.popcorn}
        className="mb-8"
        variant="kiosk"
        userName={myPlayerName}
        onCreatePerson={onCreatePerson}
        onBongClaimed={onBongClaimed}
        activePersonId={activePersonId}
        activePerson={activePerson}
        onGoToProfile={onGoToProfile}
      />

      {/* Kiosk Menu List */}
      <div className="rounded-3xl p-4 sm:p-8 bg-zinc-900 border-2 border-zinc-800 shadow-artistic-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              Kioskmeny & Varmmat
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5">
              Trykk på <strong className="text-amber-400">+</strong> for å velge hva du vil ha. Beløpet summeres automatisk!
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
            {kioskItems.map((item) => {
              const isAvail = item.isAvailable ?? true;
              const currentQty = cart[item.id] || 0;
              const cleanPrice = getCleanItemPrice(item.price);
              const priceDisplay = cleanPrice === 0 ? 'Gratis' : `${cleanPrice} kr`;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 shadow-artistic-sm transition-all ${
                    currentQty > 0
                      ? 'bg-zinc-950 border-amber-400 ring-2 ring-amber-400/20 shadow-artistic-md'
                      : isAvail
                      ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 select-none">{item.icon || '🛒'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h4 className="font-black text-white text-sm">
                            {item.name}
                          </h4>
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
                          {item.allowsFreeBong && (
                            <span className="text-[9px] bg-lime-400/20 text-lime-400 border border-lime-400/30 px-1.5 py-0.5 rounded font-bold">
                              Gratis bong
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

                  {/* Add / Remove buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-1">
                    <span className="text-[11px] text-zinc-400 font-bold truncate mr-2">
                      {currentQty > 0 ? (
                        <span className="text-amber-400 font-black">
                          {currentQty} stk ({cleanPrice * currentQty} kr)
                        </span>
                      ) : (
                        isAvail ? 'Velg antall' : 'Ikke tilgjengelig'
                      )}
                    </span>

                    {isAvail ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {currentQty > 0 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-black transition-colors cursor-pointer active:scale-95"
                            title="Fjern 1 stk"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}

                        {currentQty > 0 && (
                          <span className="w-6 text-center font-mono font-black text-sm text-white select-none">
                            {currentQty}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className={`h-8 px-3 rounded-xl font-black text-xs uppercase flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                            currentQty > 0
                              ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-artistic-sm'
                              : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black shadow-artistic-sm'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{currentQty > 0 ? 'Legg til' : 'Legg til'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Utsolgt</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* FLOATING STICKY ORDER & TOTAL BAR                    */}
      {/* Positioned safely above mobile bottom nav bar (z-40) */}
      {/* ==================================================== */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-[74px] md:bottom-6 left-2 right-2 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-950/98 backdrop-blur-xl border-2 border-amber-400 shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Cart Info & Sum */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-base shadow-artistic-sm shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-400">
                    {totalItemsCount} {totalItemsCount === 1 ? 'vare' : 'varer'}
                  </span>
                  <span className="text-zinc-600 hidden xs:inline">·</span>
                  <button
                    onClick={clearCart}
                    className="text-[10px] sm:text-xs text-zinc-400 hover:text-rose-400 font-bold underline transition-colors cursor-pointer"
                  >
                    Nullstill
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight leading-none">
                    {totalAmount} kr
                  </span>
                  <span className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate">
                    totalt
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Payment Action Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={clearCart}
                className="hidden sm:flex p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Tøm handlekurv"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowVippsModal(true)}
                className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-artistic-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>Vipps {totalAmount} kr</span>
                <ChevronRight className="w-3.5 h-3.5 hidden sm:inline opacity-80" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIPPS PAYMENT INFO MODAL / REMINDER SCREEN           */}
      {/* ==================================================== */}
      {showVippsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-orange-500/50 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-artistic-sm shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
                    Vipps Kiosken
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {settings.vippsName || 'Lillesand United Kiosk'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVippsModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Amount Card - High contrast & large text */}
            <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/15 border-2 border-orange-500/40 text-center space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 block">
                Beløp du skal taste inn i Vipps
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight py-0.5">
                {totalAmount} kr
              </div>
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                    copiedAmount
                      ? 'bg-emerald-500 text-zinc-950 shadow-artistic-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-zinc-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAmount ? 'Beløp kopiert!' : 'Kopier beløp'}</span>
                </button>
              </div>
            </div>

            {/* Vipps number card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Vipps-nummer (Kiosk)
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-white block">
                  #{settings.vippsNumber || '12345'}
                </span>
                <span className="text-xs text-zinc-400 block truncate mt-0.5">
                  {settings.vippsName || 'Lillesand United Kiosk'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyNumber}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
                  copiedNumber
                    ? 'bg-emerald-500 text-zinc-950 shadow-artistic-sm'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-zinc-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Kopiert!' : 'Kopier nr'}</span>
              </button>
            </div>

            {/* Order summary list */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                Valgte varer:
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {cartEntries.map(({ item, qty }) => {
                  const cleanPrice = getCleanItemPrice(item.price);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80"
                    >
                      <span className="font-bold text-zinc-200 flex items-center gap-1.5 truncate mr-2">
                        <span>{item.icon || '🛒'}</span>
                        <span className="truncate">{qty}x {item.name}</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold shrink-0">
                        {cleanPrice * qty} kr
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruction note */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Trykk på <strong>«Åpne Vipps nå»</strong> under. Skriv inn <strong>{totalAmount} kr</strong> og vis kvitteringen i Vipps til den som står i kiosken!
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOpenVipps}
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-artistic-md active:scale-98 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Åpne Vipps nå</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVippsModal(false);
                  clearCart();
                }}
                className="w-full py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Jeg har vippset (Tøm handlekurv)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
