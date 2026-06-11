import { VCDashboardService } from './vc-dashboard.service';
import { MoatMetricsService } from './moat-metrics.service';
export declare class VCIntelligenceController {
    private readonly vcDashboard;
    private readonly moatMetrics;
    constructor(vcDashboard: VCDashboardService, moatMetrics: MoatMetricsService);
    /**
     * The single endpoint an investor opens.
     * Complete company snapshot — traction, revenue, moat, flywheel, narrative.
     */
    getSnapshot(): Promise<{
        data: import("./vc-dashboard.service").VCSnapshot;
    }>;
    /**
     * Deep-dive: Moat strength analysis.
     */
    getMoatAssessment(): Promise<{
        data: import("./moat-metrics.service").MoatAssessment;
    }>;
    /**
     * Deep-dive: Unit economics.
     */
    getUnitEconomics(): Promise<{
        data: {
            cac: number;
            ltvCacRatio: number;
            paybackMonths: number;
            grossMargin: number;
        };
    }>;
    /**
     * Deep-dive: Investment narrative (pitch-ready).
     */
    getNarrative(): Promise<{
        data: import("./vc-dashboard.service").InvestmentNarrative;
    }>;
    /**
     * Traction summary — the numbers that matter.
     */
    getTraction(): Promise<{
        data: {
            traction: {
                dau: number;
                wau: number;
                mau: number;
                aiRequestsPerDau: number;
                d7Retention: number | null;
                d30Retention: number | null;
                totalUsers: number;
                growthRate: number;
            };
            revenue: {
                mrr: number;
                arr: number;
                arpu: number;
                arppu: number;
                ltv: number;
                payingUsers: number;
                paidConversionRate: number;
                projectedMrr6Months: number;
            };
            flywheel: {
                health: string;
                velocity: number;
                autonomousCycles: number;
                uptime: string;
                currentObjective: string;
            };
        };
    }>;
}
//# sourceMappingURL=vc-intelligence.controller.d.ts.map