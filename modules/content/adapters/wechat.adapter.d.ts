import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';
/**
 * 公众号 Adapter — 深度内容，信息量大，适合转发
 *
 * 规则：
 * - 标题 15-30 字，信息量大（不是标题党，是信息密度高）
 * - 开头有导语 (lead paragraph)
 * - 正文 800-2000 字，结构清晰
 * - H2 分段，每段 3-5 句
 * - 结尾加「阅读原文」/「关注」引导
 * - 封面图 prompt 单独生成
 */
export declare class WechatAdapter implements PlatformAdapter {
    readonly platform = "wechat";
    readonly maxLength = 2000;
    readonly bestTimeUTC = "12:30";
    readonly format = "markdown";
    adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
    private extractKeyInsight;
}
//# sourceMappingURL=wechat.adapter.d.ts.map