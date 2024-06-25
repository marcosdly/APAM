/**
 * Anti-circular dependency workaround.
 */

import knex from 'knex';
import type { Knex } from 'knex';
import { secrets, env } from '../docker';

export const ConnectionMetaOptions: Partial<Knex.MySqlConnectionConfig> = {
  timezone: '-03:00', // Brasília time zone
  charset: 'utf-8',
} as const;

// TODO: Set environment variables on docker deployment
export const client = knex({
  client: 'mysql2',
  connection: {
    host: env.APAM_DB_HOST,
    port: env.APAM_DB_PORT,
    user: secrets.username,
    password: secrets.password,
    database: secrets.databaseName,
    ...ConnectionMetaOptions,
  },
});
