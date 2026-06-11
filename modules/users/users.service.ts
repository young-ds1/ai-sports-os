import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findBySupabaseUid(uid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { supabase_uid: uid } });
  }

  async createOrUpdate(data: Partial<User>): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { supabase_uid: data.supabase_uid },
    });
    if (existing) {
      await this.userRepo.update(existing.id, data);
      return this.findBySupabaseUid(data.supabase_uid!)!;
    }
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async getTodayRemainingUsage(userId: string): Promise<number> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return 0;
    return Math.max(0, user.daily_limit);
  }
}
