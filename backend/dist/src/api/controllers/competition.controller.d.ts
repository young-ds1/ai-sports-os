import { CompetitionsService } from '../../../../modules/domain/competitions/competitions.service';
export declare class CompetitionController {
    private readonly competitionsService;
    constructor(competitionsService: CompetitionsService);
    findAll(): Promise<import("@modules/domain/competitions/competition.entity").Competition[]>;
    findById(id: string): Promise<import("@modules/domain/competitions/competition.entity").Competition | null>;
}
//# sourceMappingURL=competition.controller.d.ts.map