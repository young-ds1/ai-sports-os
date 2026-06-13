import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  status?: string;
  clock?: string;
  recordedAt?: string;
}

interface ResultsData {
  description: string;
  lastUpdated: string;
  source: string;
  results: MatchResult[];
  teamStats: Record<string, any>;
}

@Injectable()
export class MatchResultsService {
  private readonly logger = new Logger(MatchResultsService.name);
  private readonly dataDir: string;
  private readonly filePath: string;

  constructor() {
    // Store results JSON in a location the backend can access
    // In Docker: /app/data, locally: the backend root
    this.dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', '..', 'data');
    this.filePath = path.join(this.dataDir, 'match-results.json');

    // Ensure directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize empty results file if not exists
    if (!fs.existsSync(this.filePath)) {
      this.writeResults({
        description: 'World Cup 2026 match results',
        lastUpdated: new Date().toISOString(),
        source: 'manual',
        results: [],
        teamStats: {},
      });
    }
  }

  getResults(): ResultsData {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Failed to read results: ${err}`);
      return { description: '', lastUpdated: '', source: '', results: [], teamStats: {} };
    }
  }

  async upsertResults(body: any): Promise<{ count: number; message: string }> {
    const incoming = body.results || [];
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return { count: 0, message: 'No results provided' };
    }

    // Read existing results
    const current = this.getResults();
    const resultMap = new Map<string, MatchResult>();

    // Index existing results by key
    for (const r of current.results) {
      const key = `${r.homeTeam}|${r.awayTeam}|${r.date}`;
      resultMap.set(key, r);
    }

    // Upsert incoming results (newer data overwrites)
    let updated = 0;
    let added = 0;
    for (const r of incoming) {
      if (!r.homeTeam || !r.awayTeam || r.homeScore == null || r.awayScore == null) continue;
      const key = `${r.homeTeam}|${r.awayTeam}|${r.date}`;
      const existing = resultMap.get(key);
      if (existing) {
        // Only update if scores changed or match progressed
        if (existing.homeScore !== r.homeScore || existing.awayScore !== r.awayScore) {
          resultMap.set(key, { ...existing, ...r, recordedAt: r.recordedAt || new Date().toISOString() });
          updated++;
        }
      } else {
        resultMap.set(key, { ...r, recordedAt: r.recordedAt || new Date().toISOString() });
        added++;
      }
    }

    // Recompute team stats
    const allResults = Array.from(resultMap.values());
    const teamStats = this.computeTeamStats(allResults);

    const output: ResultsData = {
      description: body.description || current.description || 'World Cup 2026 actual match results',
      lastUpdated: new Date().toISOString(),
      source: body.source || 'ESPN API',
      results: allResults,
      teamStats,
    };

    this.writeResults(output);
    this.logger.log(`Updated results: ${added} added, ${updated} updated, ${allResults.length} total`);

    return {
      count: allResults.length,
      message: `${added} added, ${updated} updated, ${allResults.length} total`,
    };
  }

  private computeTeamStats(results: MatchResult[]): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const r of results) {
      for (const [side, oppSide] of [['homeTeam', 'awayTeam'], ['awayTeam', 'homeTeam']] as const) {
        const team = r[side];
        const gf = side === 'homeTeam' ? r.homeScore : r.awayScore;
        const ga = side === 'homeTeam' ? r.awayScore : r.homeScore;

        if (!stats[team]) {
          stats[team] = { gp: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 };
        }
        const s = stats[team];
        s.gp++;
        s.gf += gf;
        s.ga += ga;
        if (gf > ga) s.w++;
        else if (gf === ga) s.d++;
        else s.l++;
      }
    }
    for (const team of Object.keys(stats)) {
      const s = stats[team];
      const gp = Math.max(s.gp, 1);
      s.gpg = Math.round((s.gf / gp) * 100) / 100;
      s.gapg = Math.round((s.ga / gp) * 100) / 100;
    }
    return stats;
  }

  private writeResults(data: ResultsData): void {
    // Write atomically
    const tmpPath = this.filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }
}
