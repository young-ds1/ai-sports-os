export interface AdaptedContent {
  title: string;
  body: string;
  format: 'markdown' | 'plain_text' | 'script' | 'thread';
  hashtags: string[];
  characterCount: number;
}

export interface AdaptContext {
  taskId: string;
  contentType: string;
  context: Record<string, any>;
  matchData?: {
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    competition?: string;
  };
}

export interface PlatformAdapter {
  readonly platform: string;
  readonly maxLength: number;
  readonly bestTimeUTC: string;
  readonly format: string;
  adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
}
