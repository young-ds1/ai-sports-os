// Dev-only: SQLite in-memory with auto-sync
// Production: PostgreSQL via datasource.config.ts
import { DataSource } from 'typeorm';
import * as path from 'path';

export const DevDataSource = new DataSource({
  type: 'better-sqlite3',
  database: path.join(__dirname, '..', '..', 'dev.db'),
  entities: [
    path.join(__dirname, '..', '..', 'modules/domain/**/*.entity.ts'),
    path.join(__dirname, '..', '..', 'modules/ai-engine/**/*.entity.ts'),
    path.join(__dirname, '..', '..', 'modules/users/*.entity.ts'),
    path.join(__dirname, '..', '..', 'modules/content/entities/*.entity.ts'),
  ],
  synchronize: true,  // Auto-create tables from entities
  logging: false,
});
