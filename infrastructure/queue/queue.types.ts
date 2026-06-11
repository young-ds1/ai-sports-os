export enum MatchEventType {
  MATCH_CREATED = 'match.created',
  MATCH_UPDATED = 'match.updated',
  MATCH_FINISHED = 'match.finished',
  STANDINGS_UPDATED = 'standings.updated',
}

export enum ContentEventType {
  CONTENT_DAILY = 'content.daily',
  CONTENT_MANUAL = 'content.manual',
}

export const QUEUE_NAMES = {
  MATCH_EVENTS: 'match-events',
  CONTENT_EVENTS: 'content-events',
} as const;
