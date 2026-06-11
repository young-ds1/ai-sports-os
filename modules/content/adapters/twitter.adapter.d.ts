import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';
/**
 * X/Twitter Thread Adapter
 *
 * 规则：
 * - Thread 格式：主帖 (hook) + 回复链 (details)
 * - 主帖 ≤ 280 字符，必须是炸裂观点/数据/问题
 * - 每条回复 ≤ 280 字符
 * - 用 1/、2/、3/ 标记
 * - 结尾加 link to full analysis
 * - 1-2 个精准 hashtag
 */
export declare class TwitterAdapter implements PlatformAdapter {
    readonly platform = "twitter";
    readonly maxLength = 280;
    readonly bestTimeUTC = "01:00";
    readonly format = "thread";
    adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
}
//# sourceMappingURL=twitter.adapter.d.ts.map