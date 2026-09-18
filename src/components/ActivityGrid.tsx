import React from 'react';
import { Trophy, CircleDot, Gamepad2, Music, Utensils, Sparkles, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Activity } from '../types';

interface ActivityGridProps {
  activities: Activity[];
  onSelectActivity: (id: string) => void;
}

export const ActivityGrid: React.FC<ActivityGridProps> = ({
  activities,
  onSelectActivity,
}) => {
  const isClickableActivity = (id: string) => {
    return id === 'act-tabletennis' || id === 'act-alpha' || id === 'act-kiosk' || id === 'act-gaming';
  };

  // Only show active activities to the youth, sorted: clickable first, then info cards
  const visibleActivities = activities
    .filter((a) => a.enabled)
    .sort((a, b) => {
      const aClickable = isClickableActivity(a.id);
      const bClickable = isClickableActivity(b.id);

      if (aClickable && !bClickable) return -1;
      if (!aClickable && bClickable) return 1;

      // Fixed sensible priority among clickable
      const priorityMap: Record<string, number> = {
        'act-tabletennis': 1,
        'act-gaming': 2,
        'act-kiosk': 3,
        'act-alpha': 4,
        'act-football': 5,
        'act-gathering': 6,
      };
      return (priorityMap[a.id] || 99) - (priorityMap[b.id] || 99);
    });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-lime-400" />;
      case 'CircleDot':
        return <CircleDot className="w-6 h-6 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-red-500" />;
      case 'Music':
        return <Music className="w-6 h-6 text-rose-400" />;
      case 'Utensils':
        return <Utensils className="w-6 h-6 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-sky-400" />;
      default:
        return <Trophy className="w-6 h-6 text-lime-400" />;
    }
  };

  return (
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
            Hva skjer på <span className="text-lime-400">Lillesand United?</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-medium">
            Aktiviteter, turneringer og felleskap for ungdom 13–19 år
          </p>
        </div>
        <span className="text-xs font-black uppercase tracking-wider bg-zinc-900 text-zinc-300 px-3.5 py-1.5 rounded-xl border-2 border-zinc-800 shadow-artistic-sm -rotate-1">
          Alt under samme tak i Møglestuhallen
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleActivities.map((activity) => {
          const isClickable = isClickableActivity(activity.id);
          const isMarioKart = activity.id === 'act-gaming';

          let cardStyle = 'bg-zinc-950/80 border-zinc-800/90 shadow-artistic-sm';
          if (isClickable) {
            if (isMarioKart) {
              cardStyle =
                'group bg-gradient-to-b from-zinc-900 to-zinc-950 border-red-500 shadow-artistic-red hover:-translate-y-1.5 cursor-pointer';
            } else if (activity.highlight) {
              cardStyle =
                'group bg-gradient-to-b from-zinc-900 to-zinc-950 border-lime-400 shadow-artistic-lime hover:-translate-y-1.5 cursor-pointer';
            } else {
              cardStyle =
                'group bg-zinc-900 border-zinc-800 hover:border-lime-400 shadow-artistic-md hover:-translate-y-1.5 cursor-pointer';
            }
          }

          const badgeText = isMarioKart && (activity.badge === 'Påmelding ved ankomst' || !activity.badge)
            ? 'Digital påmelding'
            : activity.badge;

          return (
            <div
              key={activity.id}
              id={`activity-card-${activity.id}`}
              onClick={() => {
                if (isClickable) onSelectActivity(activity.id);
              }}
              className={`relative rounded-3xl p-6 border-2 transition-all duration-200 flex flex-col justify-between ${cardStyle}`}
            >
              <div>
                {/* Header with icon & badge */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center shrink-0 shadow-artistic-sm ${
                      isClickable
                        ? isMarioKart
                          ? 'group-hover:scale-105 group-hover:border-red-500/60 transition-all'
                          : 'group-hover:scale-105 group-hover:border-zinc-700 transition-all'
                        : ''
                    }`}
                  >
                    {getIcon(activity.iconName)}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {badgeText && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-artistic-sm ${
                          isMarioKart
                            ? 'bg-red-500 text-white -rotate-2'
                            : activity.highlight
                            ? 'bg-lime-400 text-zinc-950 -rotate-2'
                            : 'bg-zinc-950 text-zinc-200 border-2 border-zinc-800 rotate-1'
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Short Description */}
                <h3
                  className={`text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2 transition-colors ${
                    isClickable
                      ? isMarioKart
                        ? 'group-hover:text-red-400'
                        : 'group-hover:text-lime-400'
                      : ''
                  }`}
                >
                  {activity.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed font-medium">
                  {activity.shortDesc}
                </p>
              </div>

              {/* Footer info: time, location & action */}
              <div className="pt-4 border-t-2 border-zinc-800/80 mt-auto">
                <div className="space-y-1.5 text-xs text-zinc-400 mb-1 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{activity.location}</span>
                  </div>
                </div>

                {isClickable && (
                  <div
                    className={`pt-3 flex items-center justify-between text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform ${
                      isMarioKart
                        ? 'text-red-400 group-hover:text-red-300'
                        : 'text-lime-400 group-hover:text-lime-300'
                    }`}
                  >
                    <span>
                      {activity.id === 'act-tabletennis'
                        ? 'Se cup & meld på'
                        : activity.id === 'act-gaming'
                        ? 'Meld deg på Mario Kart'
                        : activity.id === 'act-alpha'
                        ? 'Meld interesse'
                        : 'Se meny & kiosk'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
