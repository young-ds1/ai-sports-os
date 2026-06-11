"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonetizationAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonetizationAgentService = void 0;
const common_1 = require("@nestjs/common");
const pricing_test_service_1 = require("../../subscriptions/pricing-test.service");
const paywall_trigger_service_1 = require("../../subscriptions/paywall-trigger.service");
const conversion_attribution_service_1 = require("../../subscriptions/conversion-attribution.service");
const revenue_flywheel_service_1 = require("../../revenue/revenue-flywheel.service");
const upgrade_path_service_1 = require("../../revenue/upgrade-path.service");
let MonetizationAgentService = MonetizationAgentService_1 = class MonetizationAgentService {
    pricingTest;
    paywallTrigger;
    attribution;
    flywheel;
    upgradePath;
    logger = new common_1.Logger(MonetizationAgentService_1.name);
    previousOptimalPrice = {};
    constructor(pricingTest, paywallTrigger, attribution, flywheel, upgradePath) {
        this.pricingTest = pricingTest;
        this.paywallTrigger = paywallTrigger;
        this.attribution = attribution;
        this.flywheel = flywheel;
        this.upgradePath = upgradePath;
    }
    /**
     * Analyze monetization data and optimize.
     */
    async optimize(strategy, growth) {
        const dashboard = this.flywheel.getDashboard();
        const pricingResults = this.pricingTest.getResults();
        const attributionReport = this.attribution.getAttributionReport();
        // ── Pricing optimization ──
        const bestPro = pricingResults.pro.find(r => r.optimalPrice);
        const bestElite = pricingResults.elite.find(r => r.optimalPrice);
        const proPrice = bestPro?.bucket.monthlyPrice || 9;
        const elitePrice = bestElite?.bucket.monthlyPrice || 29;
        let pricingAction = 'maintain';
        if (this.previousOptimalPrice['pro'] && proPrice !== this.previousOptimalPrice['pro']) {
            pricingAction = `Pro 最优价格从 $${this.previousOptimalPrice['pro']} 变为 $${proPrice}`;
        }
        this.previousOptimalPrice = { pro: proPrice, elite: elitePrice };
        // ── Paywall optimization ──
        const topFeature = Object.entries(attributionReport.by_feature)
            .sort((a, b) => b[1].conversions - a[1].conversions)[0];
        const worstFeature = Object.entries(attributionReport.by_feature)
            .sort((a, b) => a[1].conversions - b[1].conversions)[0];
        // ── Upgrade path assessment ──
        const samplePath = this.upgradePath.evaluate('sample-user', {
            tier: 'free',
            todayAnalysisCount: 3,
            dailyLimit: 3,
            consecutiveQuestions: 0,
            hasAskedPrediction: false,
            hasViewedKeyMatch: false,
            streak: 0,
        });
        const strongestPath = samplePath.paths.sort((a, b) => b.progress - a.progress)[0];
        // ── Revenue projection ──
        const currentMrr = dashboard.revenue.estimatedMrr;
        const growthRate = pricingResults.pro.reduce((s, r) => s + r.conversions, 0) > 0
            ? 0.15 // Growing: assume 15% monthly
            : 0.05; // Early: assume 5%
        const summary = [
            `Pro 最优价格: $${proPrice}/月`,
            topFeature ? `最强转化功能: ${topFeature[0]} (${topFeature[1].conversions}次)` : '暂无转化数据',
            `当前 MRR: $${currentMrr}`,
            `下月预估 MRR: $${Math.round(currentMrr * (1 + growthRate))}`,
        ].join(' | ');
        const optimization = {
            timestamp: new Date(),
            pricing: {
                proOptimalPrice: proPrice,
                eliteOptimalPrice: elitePrice,
                recommendation: `继续 A/B 测试。Pro $${proPrice}/月表现最优。`,
                actionTaken: pricingAction,
            },
            paywall: {
                topTrigger: topFeature?.[0] || 'unknown',
                topTriggerConversionRate: topFeature?.[1]?.percent || 0,
                underperformingTrigger: worstFeature?.[0] !== topFeature?.[0] ? worstFeature?.[0] : null,
                recommendation: topFeature
                    ? `强化 "${topFeature[0]}" 触发展示频率`
                    : '等待更多转化数据',
            },
            upgradePath: {
                strongestPath: strongestPath?.id || 'unknown',
                weakestPath: samplePath.paths.sort((a, b) => a.progress - b.progress)[0]?.id || 'unknown',
                recommendation: strongestPath?.triggered
                    ? `${strongestPath.id} 已触发 — 加大该路径的升级提示`
                    : `优先推进 ${strongestPath?.id} 路径`,
            },
            revenueProjection: {
                currentMrr,
                projectedMrrNextMonth: Math.round(currentMrr * (1 + growthRate)),
                growthRate: Math.round(growthRate * 100),
            },
            summary,
        };
        this.logger.log(`[MonetizationAgent] ${summary}`);
        return optimization;
    }
};
exports.MonetizationAgentService = MonetizationAgentService;
exports.MonetizationAgentService = MonetizationAgentService = MonetizationAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_test_service_1.PricingTestService,
        paywall_trigger_service_1.PaywallTriggerService,
        conversion_attribution_service_1.ConversionAttributionService,
        revenue_flywheel_service_1.RevenueFlywheelService,
        upgrade_path_service_1.UpgradePathService])
], MonetizationAgentService);
//# sourceMappingURL=monetization-agent.service.js.map