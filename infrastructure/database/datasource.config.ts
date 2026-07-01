import { DataSource } from 'typeorm';
// dotenv loaded by @nestjs/config ConfigModule.forRoot()
try { require('dotenv').config(); } catch {}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://app:password@localhost:5432/ai_sports_os',
  entities: [
    __dirname + '/../../modules/domain/**/*.entity.ts',
    __dirname + '/../../modules/ai-engine/**/*.entity.ts',
    __dirname + '/../../modules/users/*.entity.ts',
  ],
  migrations: [__dirname + '/migrations/*.sql'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
