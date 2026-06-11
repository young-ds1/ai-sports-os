export function MatchHeader({ match }: { match: any }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div className="card p-6">
      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-2">
            {match.home_team?.short_name?.[0] || '⚽'}
          </div>
          <h2 className="font-bold text-base sm:text-lg text-center">
            {match.home_team?.name || 'Unknown'}
          </h2>
          <span className="text-xs text-gray-400">{match.home_team?.short_name}</span>
        </div>

        {/* Score block */}
        <div className="flex flex-col items-center px-4">
          {isFinished || isLive ? (
            <>
              <div className="score-display text-4xl sm:text-5xl">
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </div>
              {match.home_ht_score != null && (
                <span className="text-xs text-gray-400 mt-1">
                  HT: {match.home_ht_score} - {match.away_ht_score}
                </span>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-mono text-gray-400 font-bold">VS</div>
              <div className="text-sm text-gray-500 mt-1">
                {match.kickoff_time?.substring(0, 5) || 'TBD'}
              </div>
            </div>
          )}
          {/* Status badge */}
          <div className="mt-2">
            {isLive && <span className="status-live">🔴 {match.elapsed_minute}&apos;</span>}
            {isFinished && <span className="status-finished">FT</span>}
            {!isLive && !isFinished && <span className="status-scheduled">预告</span>}
          </div>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-2">
            {match.away_team?.short_name?.[0] || '⚽'}
          </div>
          <h2 className="font-bold text-base sm:text-lg text-center">
            {match.away_team?.name || 'Unknown'}
          </h2>
          <span className="text-xs text-gray-400">{match.away_team?.short_name}</span>
        </div>
      </div>

      {/* Stats bar */}
      {match.stats_summary && Object.keys(match.stats_summary).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-mono font-bold">{match.stats_summary.home_shots || 0}</div>
              <div className="text-xs text-gray-500">射门</div>
            </div>
            <div>
              <div className="font-mono font-bold">{match.stats_summary.home_possession || 50}%</div>
              <div className="text-xs text-gray-500">控球率</div>
            </div>
            <div>
              <div className="font-mono font-bold">{match.stats_summary.home_shots_on_target || 0}</div>
              <div className="text-xs text-gray-500">射正</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
