import { Injectable } from '@nestjs/common';
import { IProviderAdapter } from '../../../providers/provider.interface';
import { ApiFootballMockAdapter } from '../../../providers/football/api-football.mock';

@Injectable()
export class ProviderRouterService {
  private adapters = new Map<string, IProviderAdapter>();

  constructor() {
    // Phase 2: Mock adapters. Phase 3: Real HTTP adapters via config.
    this.register(new ApiFootballMockAdapter());
  }

  register(adapter: IProviderAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  getAdapter(provider: string): IProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`No provider adapter registered for: ${provider}`);
    }
    return adapter;
  }
}
