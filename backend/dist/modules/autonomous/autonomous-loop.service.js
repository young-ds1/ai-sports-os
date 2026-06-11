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
var AutonomousLoopService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousLoopService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const strategy_agent_service_1 = require("./agents/strategy-agent.service");
const content_agent_service_1 = require("./agents/content-agent.service");
const distribution_agent_service_1 = require("./agents/distribution-agent.service");
const growth_agent_service_1 = require("./agents/growth-agent.service");
const monetization_agent_service_1 = require("./agents/monetization-agent.service");
let AutonomousLoopService = AutonomousLoopService_1 = class AutonomousLoopService {
    strategyAgent;
    contentAgent;
    distributionAgent;
    growthAgent;
    monetizationAgent;
    logger = new common_1.Logger(AutonomousLoopService_1.name);
    cycles = [];
    cycleCount = 0;
    isRunning = false;
    startedAt = null;
    // Growth → Monetization feedback feeds into next Strategy cycle
    lastGrowthAnalysis = null;
    lastMonetizationOptimization = null;
    constructor(strategyAgent, contentAgent, distributionAgent, growthAgent, monetizationAgent) {
        this.strategyAgent = strategyAgent;
        this.contentAgent = contentAgent;
        this.distributionAgent = distributionAgent;
        this.growthAgent = growthAgent;
        this.monetizationAgent = monetizationAgent;
        this.startedAt = new Date();
        this.logger.log('🤖 Autonomous Loop initialized. System will run itself every 30 minutes.');
    }
    /**
     * Main autonomous loop — runs every 30 minutes.
     */
    async executeCycle() {
        if (this.isRunning) {
            this.logger.warn('Previous cycle still running — skipping');
            return;
        }
        this.isRunning = true;
        this.cycleCount++;
        const startTime = Date.now();
        const cycle = {
            cycleId: this.cycleCount,
            startedAt: new Date(),
            completedAt: null,
            durationMs: null,
            status: 'running',
            strategy: null,
            content: null,
            distribution: null,
            growth: null,
            monetization: null,
        };
        this.logger.log(`━━━ Cycle #${this.cycleCount} START ━━━`);
        try {
            // Phase 1: STRATEGY — Decide what to do
            this.logger.log(`[1/5] StrategyAgent: deciding...`);
            cycle.strategy = await this.strategyAgent.decide();
            this.logger.log(`[1/5] ✓ Strategy: ${cycle.strategy.primaryObjective} | ` +
                `covering ${cycle.strategy.matchCoverage.selectedForContent} matches | ` +
                `confidence ${cycle.strategy.confidenceScore}%`);
            // Phase 2: CONTENT — Generate based on strategy
            this.logger.log(`[2/5] ContentAgent: generating...`);
            cycle.content = await this.contentAgent.execute(cycle.strategy);
            this.logger.log(`[2/5] ✓ Content: ${cycle.content.contentPiecesGenerated} pieces | ` +
                `${cycle.content.platformsUsed.length} platforms | ` +
                `${cycle.content.errors.length} errors`);
            // Phase 3: DISTRIBUTION — Publish based on strategy
            this.logger.log(`[3/5] DistributionAgent: distributing...`);
            cycle.distribution = await this.distributionAgent.execute(cycle.strategy);
            this.logger.log(`[3/5] ✓ Distribution: ${cycle.distribution.totalPublished} published | ` +
                `${cycle.distribution.totalPending} pending`);
            // Phase 4: GROWTH — Analyze performance
            this.logger.log(`[4/5] GrowthAgent: analyzing...`);
            cycle.growth = await this.growthAgent.analyze(cycle.strategy, cycle.content, cycle.distribution);
            this.lastGrowthAnalysis = cycle.growth;
            this.logger.log(`[4/5] ✓ Growth: CTR=${(cycle.growth.contentPerformance.avgCtr * 100).toFixed(1)}% | ` +
                `${cycle.growth.recommendations.length} recommendations`);
            // Phase 5: MONETIZATION — Optimize revenue
            this.logger.log(`[5/5] MonetizationAgent: optimizing...`);
            cycle.monetization = await this.monetizationAgent.optimize(cycle.strategy, cycle.growth);
            this.lastMonetizationOptimization = cycle.monetization;
            this.logger.log(`[5/5] ✓ Monetization: Pro=$${cycle.monetization.pricing.proOptimalPrice} | ` +
                `MRR=$${cycle.monetization.revenueProjection.currentMrr}`);
            cycle.status = 'completed';
        }
        catch (err) {
            cycle.status = 'failed';
            cycle.error = err.message;
            this.logger.error(`Cycle #${this.cycleCount} FAILED: ${err.message}`, err.stack);
        }
        finally {
            cycle.completedAt = new Date();
            cycle.durationMs = Date.now() - startTime;
            this.isRunning = false;
            this.cycles.push(cycle);
            // Keep last 100 cycles
            if (this.cycles.length > 100) {
                this.cycles = this.cycles.slice(-100);
            }
            this.logger.log(`━━━ Cycle #${this.cycleCount} ${cycle.status.toUpperCase()} ` +
                `(${cycle.durationMs}ms) ━━━\n` +
                `  Strategy: ${cycle.strategy?.primaryObjective || 'N/A'}\n` +
                `  Content:  ${cycle.content?.contentPiecesGenerated || 0} pieces\n` +
                `  Dist:     ${cycle.distribution?.totalPublished || 0} published\n` +
                `  Growth:   ${cycle.growth?.priorityAction || 'N/A'}\n` +
                `  Revenue:  $${cycle.monetization?.revenueProjection.currentMrr || 0} MRR`);
        }
    }
    /**
     * Get current autonomous system status.
     */
    getStatus() {
        const uptimeMs = this.startedAt ? Date.now() - this.startedAt.getTime() : 0;
        const hours = Math.floor(uptimeMs / 3600000);
        const minutes = Math.floor((uptimeMs % 3600000) / 60000);
        return {
            isRunning: this.isRunning,
            uptime: `${hours}h ${minutes}m`,
            totalCycles: this.cycleCount,
            lastCycle: this.cycles.length > 0 ? this.cycles[this.cycles.length - 1] : null,
            currentObjective: this.cycles.length > 0
                ? this.cycles[this.cycles.length - 1].strategy?.primaryObjective || 'idle'
                : 'initializing',
            feedbackState: {
                growth: this.lastGrowthAnalysis,
                monetization: this.lastMonetizationOptimization,
            },
        };
    }
    /**
     * Get cycle history.
     */
    getHistory(limit = 20) {
        return this.cycles.slice(-limit).reverse();
    }
    /**
     * Manual trigger — force a cycle immediately.
     */
    async triggerCycle() {
        await this.executeCycle();
        return this.cycles[this.cycles.length - 1];
    }
};
exports.AutonomousLoopService = AutonomousLoopService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutonomousLoopService.prototype, "executeCycle", null);
exports.AutonomousLoopService = AutonomousLoopService = AutonomousLoopService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [strategy_agent_service_1.StrategyAgentService,
        content_agent_service_1.ContentAgentService,
        distribution_agent_service_1.DistributionAgentService,
        growth_agent_service_1.GrowthAgentService,
        monetization_agent_service_1.MonetizationAgentService])
], AutonomousLoopService);
//# sourceMappingURL=autonomous-loop.service.js.map