'use client';

export function AnalysisReport({ data }: { data: any }) {
  // If it's a text summary (mock mode or raw LLM output)
  if (data.summary && typeof data.summary === 'string') {
    return (
      <div className="card p-6">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
          {data.summary}
        </div>
      </div>
    );
  }

  // Structured analysis
  return (
    <div className="space-y-4">
      {data.summary && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-green-50">
          <h3 className="font-bold text-sm mb-2">💡 AI 总结</h3>
          <p className="text-gray-700 text-sm">{data.summary}</p>
        </div>
      )}

      {data.recent_form && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">📊 近期状态</h3>
          <p className="text-gray-700 text-sm">
            {typeof data.recent_form === 'string'
              ? data.recent_form
              : JSON.stringify(data.recent_form)}
          </p>
        </div>
      )}

      {data.attack_defense && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">⚔️ 攻防能力</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(data.attack_defense).map(([team, stats]: [string, any]) => (
              <div key={team} className="bg-gray-50 rounded-lg p-2">
                <div className="font-medium mb-1">{team}</div>
                <div className="text-xs text-gray-500">
                  Attack: {stats.attack} | Defense: {stats.defense}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.key_players && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">👤 关键球员</h3>
          <div className="space-y-2">
            {data.key_players.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500 text-xs">{p.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.comprehensive_score && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">🎯 综合评分</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(data.comprehensive_score).map(([team, score]) => (
              <div key={team} className="flex items-center gap-2">
                <span className="font-medium">{team}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="font-mono text-sm">{score as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
