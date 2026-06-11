"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoatMetricsService = void 0;
const common_1 = require("@nestjs/common");
let MoatMetricsService = class MoatMetricsService {
    /**
     * Full moat assessment backed by live system metrics.
     */
    assess(metrics) {
        const moats = [
            this.assessEventGraph(metrics),
            this.assessBehavioralFlywheel(metrics),
            this.assessAdaptivePrediction(metrics),
        ];
        const overall = Math.round(moats.reduce((sum, m) => sum + m.score, 0) / moats.length);
        const dataRate = metrics.totalEvents + metrics.totalAiAnalyses + metrics.totalChatMessages;
        return {
            moats,
            overallMoatScore: overall,
            defensibilityRating: overall >= 70 ? 'impregnable'
                : overall >= 50 ? 'strong'
                    : overall >= 30 ? 'developing'
                        : 'weak',
            dataAccumulationRate: dataRate,
            switchingCostEstimate: this.estimateSwitchingCost(metrics),
        };
    }
    /**
     * Moat 1: Real-time Event Graph
     *
     * Every match, event, player action is ingested, normalized, and linked.
     * The graph grows denser with each game — making it increasingly
     * expensive for competitors to replicate.
     */
    assessEventGraph(m) {
        const entityCount = m.totalMatches + m.totalEvents;
        const density = entityCount > 1000 ? 80
            : entityCount > 100 ? 50
                : entityCount > 10 ? 25
                    : 10;
        return {
            name: 'Real-time Event Graph',
            description: '每场比赛、事件、球员动作的结构化知识图谱',
            score: density,
            trend: entityCount > 50 ? 'strengthening' : 'stable',
            keyMetric: '事件节点数',
            metricValue: `${entityCount} nodes`,
            evidence: [
                `已索引 ${m.totalMatches} 场比赛的结构化事件`,
                `Provider-agnostic schema — 切换数据源无需改图结构`,
                `每场比赛新增 ~12 个事件节点，每赛季 ×1000 场`,
            ],
            vcNarrative: '这不是数据库，是实时体育事件的知识图谱。数据越多，图越密，护城河越深。每场比赛都在为我们的 AI 模型增加训练素材。',
        };
    }
    /**
     * Moat 2: Behavioral Data Flywheel
     *
     * Every user question, analysis view, and conversion signal feeds back
     * into better content, better predictions, and better retention.
     * This is a data network effect — more users → better AI → more users.
     */
    assessBehavioralFlywheel(m) {
        const interactions = m.totalChatMessages + m.totalAiAnalyses;
        const flywheelScore = m.dau > 500 ? 90
            : m.dau > 100 ? 65
                : m.dau > 30 ? 40
                    : m.dau > 5 ? 20
                        : 5;
        const retentionScore = (m.d7Retention || 0) > 25 ? 25
            : (m.d7Retention || 0) > 15 ? 15
                : 5;
        return {
            name: 'Behavioral Data Flywheel',
            description: '用户行为数据反哺 AI，AI 提升反哺留存的数据飞轮',
            score: Math.min(100, flywheelScore + retentionScore),
            trend: (m.d7Retention || 0) > 15 ? 'strengthening' : 'stable',
            keyMetric: 'AI Requests / DAU',
            metricValue: `${(m.aiRequestsPerDau || 0).toFixed(1)}`,
            evidence: [
                `${interactions} 次用户-AI 交互 = ${interactions} 个偏好数据点`,
                `${m.hookPatternsLearned} 个内容模式通过 CTR 反馈持续优化`,
                `转化漏斗: impression → click → AI use → pay → retention`,
            ],
            vcNarrative: '每多一个用户，AI 就多了解一分体育决策需求。数据飞轮让先发优势转化为不可逾越的体验鸿沟。',
        };
    }
    /**
     * Moat 3: Adaptive AI Prediction Engine
     *
     * Predictions are verified against actual results. Incorrect predictions
     * feed back to improve the model. This is self-improving prediction accuracy
     * that gets better with every match.
     */
    assessAdaptivePrediction(m) {
        const verifiedCount = m.predictionsVerified || 0;
        const correctCount = m.predictionsCorrect || 0;
        const accuracy = verifiedCount > 0 ? (correctCount / verifiedCount) * 100 : 0;
        const adaptiveScore = verifiedCount > 500 ? 85
            : verifiedCount > 100 ? 60
                : verifiedCount > 20 ? 35
                    : verifiedCount > 0 ? 20
                        : 5;
        const accuracyBonus = accuracy > 65 ? 15 : accuracy > 55 ? 10 : 0;
        return {
            name: 'Adaptive AI Prediction Engine',
            description: '预测结果赛后验证 → 错误反馈 → 模型自我改进',
            score: Math.min(100, adaptiveScore + accuracyBonus),
            trend: verifiedCount > 10 ? 'strengthening' : 'stable',
            keyMetric: '预测验证次数',
            metricValue: `${verifiedCount} verified (${accuracy.toFixed(0)}% accuracy)`,
            evidence: [
                verifiedCount > 0
                    ? `${verifiedCount} 次预测已赛后验证，${correctCount} 次正确`
                    : '预测系统就绪，等待比赛数据进行首次验证',
                'A/B 测试框架持续优化预测模型参数',
                `${m.abTestCycles} 轮 A/B 测试已执行`,
            ],
            vcNarrative: verifiedCount > 50
                ? `预测准确率 ${accuracy.toFixed(0)}%，每场比赛后自动校准。这个数字只会上升，不会下降。`
                : '预测引擎基于真实比赛结果持续校准。先发优势：我们的模型比后来者多看到 N 场比赛的验证数据。',
        };
    }
    estimateSwitchingCost(m) {
        const dataPoints = m.totalMatches + m.totalEvents + m.totalAiAnalyses + m.totalChatMessages;
        if (dataPoints > 10000)
            return '极高 — 10K+ 结构化数据点，完整用户行为图谱，迁移成本 > $500K';
        if (dataPoints > 1000)
            return '高 — 1K+ 数据点，用户习惯已形成，迁移成本 > $50K';
        if (dataPoints > 100)
            return '中等 — 数据积累中，早期用户锁定进行中';
        return '构建中 — 先发优势窗口期，需快速积累数据';
    }
};
exports.MoatMetricsService = MoatMetricsService;
exports.MoatMetricsService = MoatMetricsService = __decorate([
    (0, common_1.Injectable)()
], MoatMetricsService);
//# sourceMappingURL=moat-metrics.service.js.map