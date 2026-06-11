import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';
/**
 * 小红书 Adapter — 风格：真实、种草感、emoji丰富、分段短句
 *
 * 规则：
 * - 标题 ≤ 20 字，必须包含痛点或悬念
 * - 正文分段落，每段 ≤ 3 行
 * - emoji 自然穿插，不堆砌
 * - 结尾加互动引导（「你怎么看？」「你觉得呢？」）
 * - Hashtags 3-5 个，1 个大词 + 2 个精准词
 */
export declare class XhsAdapter implements PlatformAdapter {
    readonly platform = "xiaohongshu";
    readonly maxLength = 1000;
    readonly bestTimeUTC = "12:00";
    readonly format = "plain_text";
    adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
    private buildHashtags;
}
//# sourceMappingURL=xiaohongshu.adapter.d.ts.map