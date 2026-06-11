const eventIcons: Record<string, string> = {
  goal: '⚽',
  penalty_goal: '⚽',
  own_goal: '🥅',
  yellow_card: '🟨',
  red_card: '🟥',
  yellow_then_red: '🟥',
  substitution: '🔄',
  penalty_missed: '❌',
  penalty_saved: '🧤',
};

export function MatchEvents({ events }: { events: any[] }) {
  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
          <span className="font-mono text-sm text-gray-500 w-8 text-right">
            {event.minute}&apos;
          </span>
          <span className="text-lg">{eventIcons[event.type] || '📌'}</span>
          <div className="flex-1">
            <span className="text-sm">{event.comment || event.type}</span>
            {event.player && (
              <span className="text-xs text-gray-500 ml-1">({event.player.name})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
