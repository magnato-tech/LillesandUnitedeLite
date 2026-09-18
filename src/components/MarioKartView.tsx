import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ArrowLeft,
  Users,
  AlertCircle,
  Loader2,
  Trophy,
  Tv,
} from 'lucide-react';
import { AppState, Person, MarioKartParticipant } from '../types';
import { registerMarioKart, withdrawMarioKart, createPerson } from '../services/api';

interface MarioKartViewProps {
  state: AppState;
  onRefreshState: () => void;
  activePersonId?: string | null;
  activePerson?: Person | null;
  currentUserName?: string | null;
  onBack: () => void;
  onOpenProfile?: () => void;
  onSelectPerson?: (person: Person | null) => void;
}

export const MarioKartView: React.FC<MarioKartViewProps> = ({
  state,
  onRefreshState,
  activePersonId = null,
  activePerson = null,
  currentUserName = null,
  onBack,
  onOpenProfile,
  onSelectPerson,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const participants = useMemo(() => {
    return state.marioKartParticipants || [];
  }, [state.marioKartParticipants]);

  // Check if current user is registered
  const isRegistered = useMemo(() => {
    if (!participants.length) return false;
    const targetId = activePersonId || activePerson?.id;
    if (targetId && participants.some((p) => p.personId === targetId || p.id === targetId)) {
      return true;
    }
    if (activePerson?.displayId) {
      const dId = activePerson.displayId.trim().toLowerCase();
      if (participants.some((p) => p.displayId?.trim().toLowerCase() === dId)) return true;
    }
    if (activePerson?.firstName) {
      const fName = activePerson.firstName.trim().toLowerCase();
      if (participants.some((p) => p.firstName.trim().toLowerCase() === fName)) return true;
    }
    if (currentUserName) {
      const cName = currentUserName.trim().toLowerCase();
      if (
        participants.some(
          (p) =>
            p.firstName.trim().toLowerCase() === cName ||
            p.displayId?.trim().toLowerCase() === cName
        )
      ) {
        return true;
      }
    }
    return false;
  }, [participants, activePersonId, activePerson, currentUserName]);

  // Find user's specific registration object
  const myRegistration = useMemo(() => {
    if (!participants.length) return null;
    const targetId = activePersonId || activePerson?.id;
    if (targetId) {
      const match = participants.find((p) => p.personId === targetId || p.id === targetId);
      if (match) return match;
    }
    if (activePerson?.displayId) {
      const dId = activePerson.displayId.trim().toLowerCase();
      const match = participants.find((p) => p.displayId?.trim().toLowerCase() === dId);
      if (match) return match;
    }
    if (activePerson?.firstName) {
      const fName = activePerson.firstName.trim().toLowerCase();
      const match = participants.find((p) => p.firstName.trim().toLowerCase() === fName);
      if (match) return match;
    }
    if (currentUserName) {
      const cName = currentUserName.trim().toLowerCase();
      const match = participants.find(
        (p) =>
          p.firstName.trim().toLowerCase() === cName ||
          p.displayId?.trim().toLowerCase() === cName
      );
      if (match) return match;
    }
    return null;
  }, [participants, activePersonId, activePerson, currentUserName]);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMessage(null);

    let personToRegister = activePerson;

    if (!personToRegister) {
      const cleanName = nameInput.trim();
      if (!cleanName) {
        setError('Vennligst skriv inn fornavnet ditt.');
        return;
      }
      setLoading(true);
      try {
        const created = await createPerson(cleanName);
        personToRegister = created.person;
        if (onSelectPerson) {
          onSelectPerson(created.person);
        }
      } catch (err: any) {
        setError(err.message || 'Kunne ikke opprette profil.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      await registerMarioKart({
        personId: personToRegister.id,
        firstName: personToRegister.firstName,
        anonymousToken: personToRegister.anonymousToken,
      });
      setSuccessMessage('Du er nå påmeldt Mario Kart & Gaming Lounge!');
      setNameInput('');
      onRefreshState();
    } catch (err: any) {
      setError(err.message || 'Kunne ikke melde på Mario Kart.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myRegistration) return;
    setLoading(true);
    setError(null);
    try {
      await withdrawMarioKart({
        participantId: myRegistration.id,
        personId: activePersonId || activePerson?.id || undefined,
        anonymousToken: activePerson?.anonymousToken || undefined,
      });
      setShowWithdrawConfirm(false);
      setSuccessMessage('Du er nå meldt av Mario Kart.');
      onRefreshState();
    } catch (err: any) {
      setError(err.message || 'Kunne ikke melde av.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top navigation back button */}
      <button
        id="btn-back-from-mariokart"
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border-2 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-wider shadow-artistic-sm transition-all cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Tilbake til oversikten</span>
      </button>

      {/* Main Hero Header Card */}
      <div
        id="mariokart-hero-card"
        className="relative overflow-hidden rounded-3xl bg-zinc-900 border-2 border-red-500/80 p-6 sm:p-8 shadow-artistic-md"
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-artistic-sm -rotate-1">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
              Gaming & Mario Kart
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider shadow-artistic-sm">
              <Tv className="w-3.5 h-3.5 text-red-400" />
              Storskjerm & stasjoner
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase mb-3">
            Mario Kart & <span className="text-red-500">Gaming Lounge</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-2xl mb-6">
            Gjør deg klar for Mario Kart på storskjerm og egne konsollstasjoner i gaming-hjørnet!
            Meld deg på listen her for å være med når spillingen sparkes i gang kl. 18:45.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-black shrink-0 shadow-artistic-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Tid:</span>
                <strong className="text-sm text-white font-black block">
                  Gaming fra kl. 18:45
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0 shadow-artistic-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Sted:</span>
                <strong className="text-sm text-white font-black block">
                  Gaming-hjørnet, Møglestuhallen
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          id="mariokart-error-msg"
          className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-400 text-sm font-bold flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          id="mariokart-success-msg"
          className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Registration Status & Action Card */}
      <div
        id="mariokart-status-card"
        className="rounded-3xl bg-zinc-900 border-2 border-zinc-800 p-6 sm:p-8 shadow-artistic-md"
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 flex items-center justify-center font-black">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-red-400 block">
                Din påmeldingsstatus
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {isRegistered ? 'Du er påmeldt' : 'Meld deg på'}
              </h2>
            </div>
          </div>

          <div>
            {isRegistered ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-artistic-sm">
                <CheckCircle2 className="w-4 h-4" />
                PÅMELDT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider border border-zinc-700">
                Ikke påmeldt
              </span>
            )}
          </div>
        </div>

        {isRegistered ? (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
                Registrert profil
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-2">
                {myRegistration?.displayId || myRegistration?.firstName || activePerson?.displayId || activePerson?.firstName}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                🎮 Du har plass på påmeldingslisten til Mario Kart & Gaming Lounge. Møt opp i gaming-hjørnet fra kl. 18:45 for å spille og delta i konkurransene!
              </p>
            </div>

            {/* Withdraw flow */}
            {!showWithdrawConfirm ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-zinc-500 font-medium">
                  Vil du ikke delta likevel? Du kan når som helst melde deg av.
                </p>
                <button
                  id="btn-withdraw-mariokart"
                  type="button"
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider border border-zinc-700 transition-all cursor-pointer"
                >
                  Meld meg av Mario Kart
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-rose-300 font-semibold">
                  Er du sikker på at du vil trekke påmeldingen din fra Mario Kart?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleWithdraw}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-artistic-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Ja, meld meg av</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(false)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activePerson ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                    Aktiv profil
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {activePerson.displayId || activePerson.firstName}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Trykk på knappen for å melde deg på Mario Kart med denne profilen.
                  </p>
                </div>

                <button
                  id="btn-register-mariokart-active"
                  type="button"
                  disabled={loading}
                  onClick={() => handleRegister()}
                  className="px-6 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm uppercase tracking-wider shadow-artistic-sm flex items-center gap-2.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Melder på...</span>
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="w-4 h-4" />
                      <span>Meld meg på Mario Kart</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-300 mb-4">
                  Skriv inn fornavnet ditt for å opprette en profil og melde deg på listen:
                </p>
                <form onSubmit={handleRegister} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    id="mariokart-firstname-input"
                    type="text"
                    placeholder="Ditt fornavn..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={30}
                    required
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-zinc-950 border-2 border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm font-bold shadow-artistic-sm"
                  />
                  <button
                    id="btn-register-mariokart-submit"
                    type="submit"
                    disabled={loading || !nameInput.trim()}
                    className="px-6 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm uppercase tracking-wider shadow-artistic-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Melder på...</span>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-4 h-4" />
                        <span>Meld på</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Public Participant List Section */}
      <div
        id="mariokart-participants-section"
        className="rounded-3xl bg-zinc-900 border-2 border-zinc-800 p-6 sm:p-8 shadow-artistic-md"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-red-500" />
              <span>Påmeldte spillere</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5">
              Oversikt over alle som har meldt seg på Mario Kart & Gaming Lounge
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 border-2 border-zinc-800 text-zinc-200 text-xs font-black uppercase tracking-wider shadow-artistic-sm">
            <span>Totalt påmeldt:</span>
            <span className="text-red-400 text-sm font-black">{participants.length}</span>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800">
            <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-semibold mb-1">
              Ingen har meldt seg på ennå!
            </p>
            <p className="text-xs text-zinc-500">
              Vær den aller første til å melde deg på Mario Kart i kveld.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {participants.map((player, idx) => {
              const isMe =
                (activePerson && player.personId === activePerson.id) ||
                (activePerson?.displayId && player.displayId === activePerson.displayId) ||
                (currentUserName && player.firstName.toLowerCase() === currentUserName.toLowerCase());

              return (
                <div
                  key={player.id}
                  id={`mk-player-${player.id}`}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-red-950/30 border-red-500/80 shadow-artistic-sm'
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isMe
                        ? 'bg-red-500 text-white font-black'
                        : 'bg-zinc-900 text-zinc-400 font-bold'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white truncate block">
                        {player.displayId || player.firstName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500 text-white shrink-0">
                          Deg
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium block">
                      Påmeldt {new Date(player.registeredAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
