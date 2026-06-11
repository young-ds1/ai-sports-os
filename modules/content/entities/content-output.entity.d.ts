import { ContentTask } from './content-task.entity';
export declare class ContentOutput {
    id: string;
    task: ContentTask;
    task_id: string;
    platform: string;
    title: string;
    content: string;
    format: string;
    hashtags: string[];
    utm_url: string;
    content_id: string;
    model_version: string;
    tokens_used: number;
    confidence_score: number;
    generated_at: Date;
    published_at: Date;
    published_url: string;
    engagement: {
        views?: number;
        likes?: number;
        shares?: number;
        comments?: number;
        clicks?: number;
        conversions?: number;
    };
    created_at: Date;
}
//# sourceMappingURL=content-output.entity.d.ts.map