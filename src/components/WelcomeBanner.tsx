import React, { useState } from 'react';
import { Sparkles, ArrowRight, KeyRound, X, Loader2 } from 'lucide-react';
import { Person } from '../types';
import { claimPersonAccessCode } from '../services/api';

interface WelcomeBannerProps {
  onSetMyPlayer: (name: string) => void;
  onClaimPerson?: (person: Person) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onSetMyPlayer,
  onClaimPerson,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSetMyPlayer(nameInput.trim());
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.replace(/\s+/g, '').trim();
    if (!clean) return;

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await claimPersonAccessCode(clean);
      setShowPinModal(false);
      if (onClaimPerson) {
        onClaimPerson(res.person);
      }
    } catch (err: any) {
      setPinError(err.message || 'Ugyldig eller utløpt PIN-kode. Sjekk koden eller be arrangør om en ny.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <>
      <div
        id="welcome-user-card"
        className="max-w-4xl mx-auto mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-lime-400 shadow-artistic-lime relative overflow-hidden"
      >
        {/* Discrete key icon button for users who already have an admin-generated PIN */}
        <button
          type="button"
          onClick={() => {
            setPinError(null);
            setPinInput('');
            setShowPinModal(true);
          }}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 p-2 rounded-xl bg-zinc-950/70 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
          title="Har du fått en PIN-kode fra arrangør?"
          aria-label="Koble til med PIN-kode"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-lime-400 text-zinc-950 text-xs font-black uppercase tracking-wider mb-3 shadow-artistic-sm -rotate-1">
            <Sparkles className="w-3.5 h-3.5" />
            Kom i gang
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
            👋 Velkommen til Lillesand United!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-xl mb-6">
            Hva heter du? Skriv inn fornavnet ditt så er du automatisk klar for bordtenniscup, gratis popcorn og kvelden. Ingen passord eller innlogging trengs!
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mb-4">
            <input
              id="welcome-firstname-input"
              type="text"
              placeholder="Skriv inn fornavnet ditt..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              maxLength={30}
              className="flex-1 px-4 py-3.5 rounded-2xl bg-zinc-950 border-2 border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 text-sm font-bold shadow-artistic-sm"
            />
            <button
              id="welcome-submit-btn"
              type="submit"
              disabled={!nameInput.trim()}
              className="px-6 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-artistic-sm flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <span>Fortsett</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-500 font-medium">
            Opprett eller endre profilen din under Min side.
          </div>
        </div>
      </div>

      {/* Discrete PIN-code modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border-2 border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-start justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Koble til profil med PIN
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    For deg som allerede er registrert av arrangør
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              Skriv inn den 6-sifrede engangskoden du fikk fra arrangør (f.eks. på SMS) for å koble telefonen din direkte til profilen din:
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  maxLength={8}
                  placeholder="6 siffer (f.eks. 582914)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900 border-2 border-zinc-800 focus:border-lime-400 text-white text-center text-xl font-mono font-black tracking-widest focus:outline-none shadow-artistic-sm"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-400 font-bold">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={pinLoading || !pinInput.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-artistic-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {pinLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kobler til...</span>
                    </>
                  ) : (
                    <span>Koble til profil</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
