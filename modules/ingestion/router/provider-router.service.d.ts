import { IProviderAdapter } from '../../../providers/provider.interface';
export declare class ProviderRouterService {
    private adapters;
    constructor();
    register(adapter: IProviderAdapter): void;
    getAdapter(provider: string): IProviderAdapter;
}
//# sourceMappingURL=provider-router.service.d.ts.map