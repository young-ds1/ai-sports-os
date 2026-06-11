import { Repository } from 'typeorm';
import { ContentTask } from './entities/content-task.entity';
import { ContentOutput } from './entities/content-output.entity';
export declare class ContentService {
    private readonly taskRepo;
    private readonly outputRepo;
    constructor(taskRepo: Repository<ContentTask>, outputRepo: Repository<ContentOutput>);
    getTasks(status?: string, limit?: number): Promise<ContentTask[]>;
    getOutputs(taskId: string): Promise<ContentOutput[]>;
    getLatestOutputs(platform?: string, limit?: number): Promise<ContentOutput[]>;
    retryTask(taskId: string): Promise<void>;
}
//# sourceMappingURL=content.service.d.ts.map