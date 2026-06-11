export interface Source {
    type: 'database' | 'knowledge_base' | 'llm_inference' | 'ai_cache';
    table?: string;
    id?: string;
    field?: string;
    doc?: string;
    model?: string;
}
export declare class SourceTracerService {
    build(sources: Source[], extra?: Partial<Source>): Source[];
    dbSource(table: string, field?: string, id?: string): Source;
    cacheSource(matchId: string): Source;
    llmSource(model?: string): Source;
    kbSource(doc: string): Source;
}
//# sourceMappingURL=source-tracer.service.d.ts.map