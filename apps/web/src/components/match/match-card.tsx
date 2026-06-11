import Link from 'next/link';

interface MatchCardProps {
  match: {
    id: string;
    home_team: { id: string; name: string; short_name?: string };
    away_team: { id: string; name: string; short_name?: string };
    home_score?: number;
    away_score?: number;
    status: string;
    kickoff_time?: string;
    match_date: string;
    group_name?: string;
    round?: string;
  };
}

const statusMap: Record<string, { label: string; className: string }> = {
  live: { label: 'LIVE', className: 'status-live' },
  finished: { label: 'FT', className: 'status-finished' },
  scheduled: { label: '预告', className: 'status-scheduled' },
};

export function MatchCard({ match }: MatchCardProps) {
  const status = statusMap[match.status] || { label: match.status, className: 'status-badge' };
  const time = match.kickoff_time ? match.kickoff_time.substring(0, 5) : 'TBD';

  return (
    <Link href={`/matches/${match.id}`} className="card block p-4">
      <div className="flex items-center justify-between">
        {/* Left: Teams + Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 justify-end text-right">
              <span className="font-semibold text-sm sm:text-base truncate max-w-[120px]">
                {match.home_team.name}
              </span>
              <span className="text-xs text-gray-400">{match.home_team.short_name}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-3">
              {match.status === 'scheduled' ? (
                <span className="text-sm font-mono text-gray-500">{time}</span>
              ) : (
                <span className="score-display">
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </span>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 text-left">
              <span className="text-xs text-gray-400">{match.away_team.short_name}</span>
              <span className="font-semibold text-sm sm:text-base truncate max-w-[120px]">
                {match.away_team.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status + Meta */}
        <div className="flex flex-col items-end gap-1 ml-4">
          <span className={status.className}>{status.label}</span>
          {match.group_name && (
            <span className="text-xs text-gray-400">Group {match.group_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
