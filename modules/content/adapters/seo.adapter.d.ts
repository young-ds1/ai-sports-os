import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';
/**
 * SEO Long-form Adapter — 搜索引擎优化文章
 *
 * 规则：
 * - 标题含关键词 + 数字 + 年份 (e.g., "2026 World Cup: Argentina vs Brazil Full Analysis")
 * - Meta description 120-155 chars
 * - H2/H3 结构清晰
 * - 正文 800-2000 字
 * - 内链自然嵌入
 * - FAQ section at the end
 */
export declare class SeoAdapter implements PlatformAdapter {
    readonly platform = "seo";
    readonly maxLength = 3000;
    readonly bestTimeUTC = "06:00";
    readonly format = "markdown";
    adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent>;
}
//# sourceMappingURL=seo.adapter.d.ts.map