export declare enum ContentTrigger {
    MATCH_FINISHED = "match_finished",// 赛后复盘
    MATCH_SCHEDULED = "match_scheduled",// 赛前预热
    PLAYER_MILESTONE = "player_milestone",// 球员里程碑（帽子戏法等）
    DAILY_DIGEST = "daily_digest",// 每日精选
    TRENDING_TOPIC = "trending_topic",// 热点事件
    MANUAL = "manual"
}
export declare enum ContentType {
    PRE_MATCH = "pre_match",// 赛前分析
    POST_MATCH = "post_match",// 赛后复盘
    PLAYER_SPOTLIGHT = "player_spotlight",// 球员聚焦
    TEAM_DEEP_DIVE = "team_deep_dive",// 球队深度
    HOT_TAKE = "hot_take",// 热点评论
    RANKING = "ranking",// 排名/榜单
    FUN_FACT = "fun_fact"
}
export declare enum ContentStatus {
    PENDING = "pending",
    GENERATING = "generating",
    COMPLETED = "completed",
    FAILED = "failed",
    PUBLISHED = "published"
}
export declare class ContentTask {
    id: string;
    trigger_type: string;
    reference_type: string;
    reference_id: string;
    content_type: string;
    target_platforms: string[];
    status: string;
    priority: number;
    input_context: Record<string, any>;
    model_version: string;
    total_tokens_used: number;
    completed_at: Date;
    created_at: Date;
}
//# sourceMappingURL=content-task.entity.d.ts.map