"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.AppDataSource = new typeorm_1.DataSource({
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
//# sourceMappingURL=datasource.config.js.map