import { readFileSync } from 'fs';

export type DockerSecrets = Record<
  'username' | 'password' | 'databaseName' | 'databaseRootPassword',
  string
>;

export interface DockerEnv {
  APAM_DB_HOST: string;
  APAM_DB_PORT: number;
}

function getSecrets(): DockerSecrets | never {
  const opts = { encoding: 'utf-8' } as const;
  try {
    return {
      username: readFileSync('/run/secrets/username', opts),
      password: readFileSync('/run/secrets/passwd', opts),
      databaseName: readFileSync('/run/secrets/default-db-name', opts),
      databaseRootPassword: readFileSync('/run/secrets/root-passwd', opts),
    } as const;
  } catch {
    // TODO: log instead of shutting down
    throw new Error("Couldn't find or parse docker secrets");
  }
}

function getEnvironment(): DockerEnv {
  const port: number = process.env.APAM_DB_PORT
    ? parseInt(process.env.APAM_DB_PORT)
    : 3030;

  return {
    APAM_DB_HOST: process.env.APAM_DB_HOST || 'localhost',
    APAM_DB_PORT: port,
  } as const;
}

export const secrets = getSecrets();

export const env = getEnvironment();
