"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsAdapter = void 0;
const common_1 = require("@nestjs/common");
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
let XhsAdapter = class XhsAdapter {
    platform = 'xiaohongshu';
    maxLength = 1000;
    bestTimeUTC = '12:00'; // 北京时间 20:00
    format = 'plain_text';
    async adapt(aiRawOutput, context) {
        // Extract first sentence as title candidate
        const lines = aiRawOutput.split('\n').filter(l => l.trim());
        let title = lines[0]?.replace(/^#+\s*/, '').substring(0, 20) || '今日赛事速递';
        if (!title.endsWith('！') && !title.endsWith('？') && !title.endsWith('…')) {
            title = title + '…';
        }
        // Build body with XHS style
        const bodyParts = [];
        const matchData = context.matchData;
        // Opening hook
        if (matchData?.homeTeam && matchData?.awayTeam) {
            bodyParts.push(`🔥 ${matchData.homeTeam} vs ${matchData.awayTeam} 赛后速递来啦！`);
            bodyParts.push('');
        }
        // Main content — split into short paragraphs
        const contentLines = aiRawOutput
            .replace(/^#.*$/gm, '') // Remove markdown headers
            .replace(/\*\*/g, '') // Remove bold markers
            .split('\n')
            .filter(l => l.trim());
        for (const line of contentLines) {
            const trimmed = line.trim();
            if (trimmed.length > 60) {
                // Split long lines at natural breaks
                const parts = trimmed.match(/.{1,40}(?=[，。！？,\.!\?]|$)/g) || [trimmed];
                for (const part of parts) {
                    bodyParts.push(part);
                }
            }
            else {
                bodyParts.push(trimmed);
            }
            bodyParts.push('');
        }
        // Closing CTA
        bodyParts.push('—');
        bodyParts.push('💬 你怎么看这场比赛？评论区聊聊！');
        bodyParts.push('🔗 点击链接查看完整AI分析 →');
        const hashtags = this.buildHashtags(context);
        return {
            title,
            body: bodyParts.join('\n'),
            format: 'plain_text',
            hashtags,
            characterCount: bodyParts.join('').length,
        };
    }
    buildHashtags(context) {
        const tags = ['#世界杯2026', '#足球'];
        if (context.matchData?.homeTeam)
            tags.push(`#${context.matchData.homeTeam}`);
        if (context.matchData?.awayTeam)
            tags.push(`#${context.matchData.awayTeam}`);
        if (context.contentType === 'post_match')
            tags.push('#赛后复盘');
        if (context.contentType === 'pre_match')
            tags.push('#赛前分析');
        tags.push('#AI体育');
        // Cap at 5
        return tags.slice(0, 5);
    }
};
exports.XhsAdapter = XhsAdapter;
exports.XhsAdapter = XhsAdapter = __decorate([
    (0, common_1.Injectable)()
], XhsAdapter);
//# sourceMappingURL=xiaohongshu.adapter.js.map