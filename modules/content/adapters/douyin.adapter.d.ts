import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';
/**
 * 抖音/TikTok 脚本 Adapter
 *
 * 规则：
 * - 输出视频脚本格式（旁白 + 画面描述）
 * - 开头 3 秒钩子（必须是冲击力强的数据/画面）
 * - 总时长 30-60 秒（约 150-300 字口播）
 * - 脚本分「画面」+ 「口播」两列
 * - 结尾：引导点赞 + 关注
 */
export declare class DouyinAdapter implements PlatformAdapter {
    readonly platform = "douyin";
    readonly maxLength = 500;
    readonly bestTimeUTC = "12:00";
    readonly format = "script";
    adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
    private generateTitle;
    private buildHook;
    private buildBody;
    private extractAiInsight;
}
//# sourceMappingURL=douyin.adapter.d.ts.map