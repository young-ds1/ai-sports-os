"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ICPValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICPValidationService = exports.USER_SEGMENTS = void 0;
const common_1 = require("@nestjs/common");
// ── User Segments ──
exports.USER_SEGMENTS = {
    football_fans: 'Football Fans',
    fantasy_players: 'Fantasy Players',
    sports_bettors: 'Sports Bettors',
    ai_enthusiasts: 'AI Enthusiasts',
    content_creators: 'Content Creators',
    casual_users: 'Casual Sports Users',
};
let ICPValidationService = ICPValidationService_1 = class ICPValidationService {
    logger = new common_1.Logger(ICPValidationService_1.name);
    users = new Map();
    // ── Segment the user ──
    segmentUser(userId, segment) {
        let user = this.users.get(userId);
        if (!user) {
            user = {
                userId, segment, channel: 'direct', contentExperiment: 'prediction',
                sessions: 0, aiRequests: 0, retentionDays: 0,
                hasUpgraded: false, hasPaid: false, revenue: 0, referrals: 0,
                firstSeen: new Date(), lastSeen: new Date(),
            };
        }
        user.segment = segment;
        this.users.set(userId, user);
    }
    // ── Track actions per user ──
    trackAction(userId, params) {
        let user = this.users.get(userId);
        if (!user) {
            user = {
                userId, segment: 'casual_users', channel: params.channel || 'direct',
                contentExperiment: params.contentExperiment || 'prediction',
                sessions: 0, aiRequests: 0, retentionDays: 0,
                hasUpgraded: false, hasPaid: false, revenue: 0, referrals: 0,
                firstSeen: new Date(), lastSeen: new Date(),
            };
        }
        if (params.channel)
            user.channel = params.channel;
        if (params.contentExperiment)
            user.contentExperiment = params.contentExperiment;
        switch (params.action) {
            case 'session':
                user.sessions++;
                user.retentionDays++;
                break;
            case 'ai_request':
                user.aiRequests++;
                break;
            case 'upgrade':
                user.hasUpgraded = true;
                break;
            case 'payment':
                user.hasPaid = true;
                user.revenue += (params.amount || 9);
                break;
            case 'referral':
                user.referrals++;
                break;
        }
        user.lastSeen = new Date();
        this.users.set(userId, user);
    }
    // ── STEP 2: Aggregate by segment ──
    getSegmentProfiles() {
        const bySegment = new Map();
        for (const [key] of Object.entries(exports.USER_SEGMENTS)) {
            bySegment.set(key, []);
        }
        for (const user of this.users.values()) {
            const seg = bySegment.get(user.segment) || [];
            seg.push(user);
            bySegment.set(user.segment, seg);
        }
        // Compute global maxes for scoring normalization
        let globalMaxRetention = 0, globalMaxAi = 0, globalMaxRevenue = 0, globalMaxReferral = 0;
        const allSegProfiles = [];
        for (const [seg, users] of bySegment) {
            allSegProfiles.push({ seg, users });
            if (users.length > 0) {
                const avgRet = users.reduce((s, u) => s + u.retentionDays, 0) / users.length;
                const avgAi = users.reduce((s, u) => s + u.aiRequests, 0) / users.length;
                const avgRev = users.reduce((s, u) => s + u.revenue, 0) / users.length;
                const avgRef = users.reduce((s, u) => s + u.referrals, 0) / users.length;
                globalMaxRetention = Math.max(globalMaxRetention, avgRet);
                globalMaxAi = Math.max(globalMaxAi, avgAi);
                globalMaxRevenue = Math.max(globalMaxRevenue, avgRev);
                globalMaxReferral = Math.max(globalMaxReferral, avgRef);
            }
        }
        if (globalMaxRetention === 0)
            globalMaxRetention = 1;
        if (globalMaxAi === 0)
            globalMaxAi = 1;
        if (globalMaxRevenue === 0)
            globalMaxRevenue = 1;
        if (globalMaxReferral === 0)
            globalMaxReferral = 1;
        const profiles = [];
        for (const { seg, users } of allSegProfiles) {
            const n = Math.max(users.length, 1);
            const totalSessions = users.reduce((s, u) => s + u.sessions, 0);
            const totalAi = users.reduce((s, u) => s + u.aiRequests, 0);
            const totalRevenue = users.reduce((s, u) => s + u.revenue, 0);
            const totalReferrals = users.reduce((s, u) => s + u.referrals, 0);
            const avgRetDays = users.reduce((s, u) => s + u.retentionDays, 0) / n;
            const avgAi = totalAi / n;
            const avgRevenue = totalRevenue / n;
            const avgReferral = totalReferrals / n;
            // ICP Score: normalized to best-in-class
            const retentionScore = Math.round((avgRetDays / globalMaxRetention) * 40);
            const aiUsageScore = Math.round((avgAi / globalMaxAi) * 30);
            const revenueScore = Math.round((avgRevenue / globalMaxRevenue) * 20);
            const referralScore = Math.round((avgReferral / globalMaxReferral) * 10);
            const icpScore = Math.min(100, retentionScore + aiUsageScore + revenueScore + referralScore);
            // Tier
            let tier;
            if (icpScore >= 60 && users.length >= 10)
                tier = 'core_icp';
            else if (icpScore >= 40)
                tier = 'growth_icp';
            else if (users.length > 0)
                tier = 'emerging';
            else
                tier = 'low_value';
            profiles.push({
                segmentKey: seg,
                segmentName: exports.USER_SEGMENTS[seg],
                users: users.length,
                dau: Math.round(users.filter(u => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    return u.lastSeen >= d;
                }).length),
                avgSessionsPerUser: Math.round((totalSessions / n) * 10) / 10,
                aiRequestsPerUser: Math.round(avgAi * 10) / 10,
                retentionD7: Math.round((users.filter(u => u.retentionDays >= 7).length / n) * 100),
                retentionD30: Math.round((users.filter(u => u.retentionDays >= 30).length / n) * 100),
                upgradeClicks: users.filter(u => u.hasUpgraded).length,
                payments: users.filter(u => u.hasPaid).length,
                revenueTotal: Math.round(totalRevenue),
                revenuePerUser: Math.round(avgRevenue * 100) / 100,
                ltvEstimate: Math.round(avgRevenue * 6 * 100) / 100, // 6-month LTV
                referralCount: totalReferrals,
                referralRate: Math.round((users.filter(u => u.referrals > 0).length / n) * 100),
                retentionScore, aiUsageScore, revenueScore, referralScore,
                icpScore, tier,
            });
        }
        // Sort by ICP score desc
        profiles.sort((a, b) => b.icpScore - a.icpScore);
        // Seed demo if empty
        if (profiles.every(p => p.users === 0)) {
            return this.seedSegmentProfiles();
        }
        return profiles;
    }
    // ── STEP 5: Best fit per segment ──
    getBestFitPerSegment() {
        const results = [];
        const channelMap = {
            football_fans: { channel: 'x', qualityScore: 68, count: 45 },
            fantasy_players: { channel: 'x', qualityScore: 72, count: 28 },
            sports_bettors: { channel: 'telegram', qualityScore: 55, count: 15 },
            ai_enthusiasts: { channel: 'x', qualityScore: 78, count: 35 },
            content_creators: { channel: 'xiaohongshu', qualityScore: 62, count: 20 },
            casual_users: { channel: 'seo', qualityScore: 25, count: 60 },
        };
        const contentMap = {
            football_fans: { experiment: '预测类', aiPerUser: 3.2, retention: 45 },
            fantasy_players: { experiment: '战术分析', aiPerUser: 4.1, retention: 52 },
            sports_bettors: { experiment: '预测类', aiPerUser: 5.0, retention: 38 },
            ai_enthusiasts: { experiment: '争议观点', aiPerUser: 4.5, retention: 48 },
            content_creators: { experiment: 'AI神准', aiPerUser: 2.8, retention: 35 },
            casual_users: { experiment: '预测类', aiPerUser: 0.8, retention: 12 },
        };
        const matchMap = {
            football_fans: { type: '强强对话 (Argentina-Brazil)', engagement: 85, reason: '顶级球队对决 = 最高参与度' },
            fantasy_players: { type: '高比分比赛 (进球≥4)', engagement: 90, reason: '进球多 = 数据点丰富 = 幻想体育玩家需要' },
            sports_bettors: { type: '淘汰赛/决赛', engagement: 88, reason: '高风险比赛 = 决策需求最强' },
            ai_enthusiasts: { type: '战术复杂的比赛', engagement: 82, reason: '战术复杂度高 = AI 分析价值最大' },
            content_creators: { type: '有争议判罚的比赛', engagement: 75, reason: '争议 = 内容素材 = 传播力强' },
            casual_users: { type: '强队出场 (Argentina/Brazil)', engagement: 60, reason: '球星效应驱动' },
        };
        for (const [key, name] of Object.entries(exports.USER_SEGMENTS)) {
            const segKey = key;
            const ch = channelMap[segKey] || { channel: 'unknown', qualityScore: 0, count: 0 };
            const co = contentMap[segKey] || { experiment: 'unknown', aiPerUser: 0, retention: 0 };
            const ma = matchMap[segKey] || { type: 'unknown', engagement: 0, reason: '' };
            results.push({
                segmentKey: segKey,
                bestChannel: { channel: ch.channel, userCount: ch.count, qualityScore: ch.qualityScore },
                bestContent: { experiment: co.experiment, aiPerUser: co.aiPerUser, retention: co.retention },
                bestMatchType: ma,
            });
        }
        return results;
    }
    // ── STEP 6: Weekly ICP Report ──
    getICPWeeklyReport() {
        const profiles = this.getSegmentProfiles();
        const bestFit = this.getBestFitPerSegment();
        const fitMap = new Map(bestFit.map(f => [f.segmentKey, f]));
        const top = profiles[0];
        const highestRevenue = [...profiles].sort((a, b) => b.revenuePerUser - a.revenuePerUser)[0];
        const highestRetention = [...profiles].sort((a, b) => b.retentionD7 - a.retentionD7)[0];
        const highestReferral = [...profiles].sort((a, b) => b.referralRate - a.referralRate)[0];
        // Growth allocation based on ICP quality, not traffic
        const totalIcp = profiles.reduce((s, p) => s + Math.max(p.icpScore, 1), 0);
        const growthAllocation = profiles.slice(0, 4).map(p => ({
            segment: p.segmentName,
            budgetPct: totalIcp > 0 ? Math.round((p.icpScore / totalIcp) * 100) : 0,
            reason: p.tier === 'core_icp' ? '核心 ICP — 最高长期价值'
                : p.tier === 'growth_icp' ? '增长 ICP — 潜力大'
                    : '观察中 — 数据不足',
        }));
        return {
            week: `${this.daysAgo(7)} → ${this.today()}`,
            topSegment: {
                name: top?.segmentName || '数据不足',
                icpScore: top?.icpScore || 0,
                why: top ? `${top.segmentName} ICP=${top.icpScore}分。留存${top.retentionD7}%，AI/U=${top.aiRequestsPerUser}，收入/人=$${top.revenuePerUser}。` : '等待数据',
            },
            whoPays: {
                segment: highestRevenue?.segmentName || '暂无',
                revenuePerUser: highestRevenue?.revenuePerUser || 0,
                totalRevenue: highestRevenue?.revenueTotal || 0,
            },
            whoStays: {
                segment: highestRetention?.segmentName || '暂无',
                retentionD7: highestRetention?.retentionD7 || 0,
                retentionD30: highestRetention?.retentionD30 || 0,
            },
            whoShares: {
                segment: highestReferral?.segmentName || '暂无',
                referralRate: highestReferral?.referralRate || 0,
                totalReferrals: highestReferral?.referralCount || 0,
            },
            growthAllocation,
            segmentRanking: profiles.map(p => ({
                name: p.segmentName, icpScore: p.icpScore, tier: p.tier, users: p.users,
            })),
            recommendation: top
                ? `核心 ICP: ${top.segmentName} (${top.icpScore}分)。` +
                    `所有增长预算优先分配给核心 ICP 和增长 ICP 群体。` +
                    `内容策略向 ${fitMap.get(top.segmentKey)?.bestContent.experiment || '预测类'} 倾斜。` +
                    `${highestRevenue?.segmentName} 付费意愿最强 ($${highestRevenue?.revenuePerUser || 0}/人)。` +
                    `${highestRetention?.segmentName} 留存最高 (${highestRetention?.retentionD7 || 0}%)。`
                : '数据不足，持续追踪用户行为，7天后首次 ICP 评分。',
        };
    }
    // ── Helpers ──
    today() { return new Date().toISOString().split('T')[0]; }
    daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    }
    // ── Demo seed ──
    seedSegmentProfiles() {
        const data = [
            { segmentKey: 'fantasy_players', users: 42, dau: 18, avgSessionsPerUser: 4.2, aiRequestsPerUser: 4.5, retentionD7: 55, retentionD30: 32, upgradeClicks: 12, payments: 8, revenueTotal: 72, revenuePerUser: 1.71, ltvEstimate: 10.26, referralCount: 15, referralRate: 28 },
            { segmentKey: 'sports_bettors', users: 35, dau: 15, avgSessionsPerUser: 5.1, aiRequestsPerUser: 5.8, retentionD7: 48, retentionD30: 25, upgradeClicks: 15, payments: 10, revenueTotal: 90, revenuePerUser: 2.57, ltvEstimate: 15.42, referralCount: 8, referralRate: 18 },
            { segmentKey: 'football_fans', users: 65, dau: 25, avgSessionsPerUser: 2.8, aiRequestsPerUser: 2.5, retentionD7: 38, retentionD30: 20, upgradeClicks: 8, payments: 4, revenueTotal: 36, revenuePerUser: 0.55, ltvEstimate: 3.30, referralCount: 20, referralRate: 22 },
            { segmentKey: 'ai_enthusiasts', users: 28, dau: 12, avgSessionsPerUser: 3.5, aiRequestsPerUser: 4.2, retentionD7: 45, retentionD30: 28, upgradeClicks: 6, payments: 3, revenueTotal: 27, revenuePerUser: 0.96, ltvEstimate: 5.76, referralCount: 12, referralRate: 32 },
            { segmentKey: 'content_creators', users: 18, dau: 8, avgSessionsPerUser: 3.0, aiRequestsPerUser: 2.8, retentionD7: 35, retentionD30: 18, upgradeClicks: 4, payments: 2, revenueTotal: 18, revenuePerUser: 1.00, ltvEstimate: 6.00, referralCount: 10, referralRate: 40 },
            { segmentKey: 'casual_users', users: 80, dau: 20, avgSessionsPerUser: 1.2, aiRequestsPerUser: 0.6, retentionD7: 12, retentionD30: 3, upgradeClicks: 1, payments: 0, revenueTotal: 0, revenuePerUser: 0, ltvEstimate: 0, referralCount: 3, referralRate: 3 },
        ];
        // Calculate ICP scores with normalization
        const maxRet = Math.max(...data.map(d => d.retentionD7 || 0), 1);
        const maxAi = Math.max(...data.map(d => d.aiRequestsPerUser || 0), 1);
        const maxRev = Math.max(...data.map(d => d.revenuePerUser || 0), 1);
        const maxRef = Math.max(...data.map(d => d.referralRate || 0), 1);
        return data.map(d => {
            const rs = Math.round(((d.retentionD7 || 0) / maxRet) * 40);
            const as = Math.round(((d.aiRequestsPerUser || 0) / maxAi) * 30);
            const rvs = Math.round(((d.revenuePerUser || 0) / maxRev) * 20);
            const rfs = Math.round(((d.referralRate || 0) / maxRef) * 10);
            const icp = Math.min(100, rs + as + rvs + rfs);
            return {
                segmentKey: d.segmentKey, segmentName: exports.USER_SEGMENTS[d.segmentKey],
                users: d.users, dau: d.dau, avgSessionsPerUser: d.avgSessionsPerUser,
                aiRequestsPerUser: d.aiRequestsPerUser, retentionD7: d.retentionD7,
                retentionD30: d.retentionD30, upgradeClicks: d.upgradeClicks,
                payments: d.payments, revenueTotal: d.revenueTotal, revenuePerUser: d.revenuePerUser,
                ltvEstimate: d.ltvEstimate, referralCount: d.referralCount,
                referralRate: d.referralRate, retentionScore: rs, aiUsageScore: as,
                revenueScore: rvs, referralScore: rfs, icpScore: icp,
                tier: icp >= 70 ? 'core_icp' : icp >= 50 ? 'growth_icp' : icp >= 25 ? 'emerging' : 'low_value',
            };
        }).sort((a, b) => b.icpScore - a.icpScore);
    }
};
exports.ICPValidationService = ICPValidationService;
exports.ICPValidationService = ICPValidationService = ICPValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], ICPValidationService);
//# sourceMappingURL=icp-validation.service.js.map