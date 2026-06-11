import { Injectable } from '@nestjs/common';

export interface Source {
  type: 'database' | 'knowledge_base' | 'llm_inference' | 'ai_cache';
  table?: string;
  id?: string;
  field?: string;
  doc?: string;
  model?: string;
}

@Injectable()
export class SourceTracerService {
  build(sources: Source[], extra?: Partial<Source>): Source[] {
    if (extra) {
      return sources.map(s => ({ ...s, ...extra }));
    }
    return sources;
  }

  dbSource(table: string, field?: string, id?: string): Source {
    return { type: 'database', table, field, id };
  }

  cacheSource(matchId: string): Source {
    return { type: 'ai_cache', id: matchId };
  }

  llmSource(model?: string): Source {
    return { type: 'llm_inference', model: model || 'gpt-4o' };
  }

  kbSource(doc: string): Source {
    return { type: 'knowledge_base', doc };
  }
}
