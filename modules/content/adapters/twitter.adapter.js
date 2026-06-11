"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterAdapter = void 0;
const common_1 = require("@nestjs/common");
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
let TwitterAdapter = class TwitterAdapter {
    platform = 'twitter';
    maxLength = 280;
    bestTimeUTC = '01:00'; // US Eastern evening
    format = 'thread';
    async adapt(aiRawOutput, context) {
        const matchData = context.matchData;
        const scoreStr = matchData?.homeScore != null
            ? `${matchData.homeScore}-${matchData.awayScore}`
            : '';
        // Build the hook tweet (must be punchy)
        let hook = '';
        if (scoreStr && matchData?.homeTeam && matchData?.awayTeam) {
            const totalGoals = (matchData.homeScore || 0) + (matchData.awayScore || 0);
            if (totalGoals >= 5) {
                hook = `🚨 ${matchData.homeTeam} ${scoreStr} ${matchData.awayTeam}\n\n${totalGoals} goals. Pure chaos. Here's what happened 🧵`;
            }
            else {
                hook = `📊 ${matchData.homeTeam} ${scoreStr} ${matchData.awayTeam}\n\nKey takeaways from this one 🧵`;
            }
        }
        else {
            const firstLine = aiRawOutput.split('\n').find(l => l.trim().length > 20) || '';
            hook = firstLine.replace(/^#+\s*/, '').substring(0, 250);
        }
        // Build thread replies
        const thread = [hook];
        // Extract key points from AI output
        const paragraphs = aiRawOutput
            .replace(/^#.*$/gm, '')
            .replace(/\*\*/g, '')
            .split('\n')
            .filter(l => l.trim())
            .map(l => l.trim());
        let counter = 1;
        for (const para of paragraphs) {
            if (para.length < 20)
                continue;
            const tweetBody = `${counter}/ ${para.substring(0, 260)}`;
            thread.push(tweetBody);
            counter++;
            if (counter > 8)
                break; // Max 8-tweet thread
        }
        // Final tweet with CTA
        thread.push(`Full AI analysis with stats & predictions →`);
        const hashtags = ['#WorldCup2026'];
        if (matchData?.competition)
            hashtags.push(`#${matchData.competition.replace(/\s+/g, '')}`);
        return {
            title: hook.substring(0, 80),
            body: thread.join('\n\n'),
            format: 'thread',
            hashtags: hashtags.slice(0, 2),
            characterCount: thread.join('').length,
        };
    }
};
exports.TwitterAdapter = TwitterAdapter;
exports.TwitterAdapter = TwitterAdapter = __decorate([
    (0, common_1.Injectable)()
], TwitterAdapter);
//# sourceMappingURL=twitter.adapter.js.map