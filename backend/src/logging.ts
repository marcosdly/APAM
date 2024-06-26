import pino from 'pino';
import type { StreamEntry, DestinationStream } from 'pino';

/**
 * Convert level code (number) into it's label (string)
 * @see {@link https://getpino.io/#/docs/help?id=level-string}
 */
function levelCodeToLabel(label: string) {
  return {
    level: label,
  };
}

const streams: StreamEntry[] = [
  { stream: process.stdout, level: 'warn' },
  { stream: process.stderr, level: 'error' },
];

const localFileDestination = pino.destination({
  dest: '/var/log/apam-backend/general.log',
  sync: false, // !important
  append: true,
  contentMode: 'utf8',
  mkdir: true,
  minLength: 4096,
});

export const std = pino(
  { formatters: { level: levelCodeToLabel } },
  pino.multistream(streams, { dedupe: true })
);

export const local = pino(
  { level: 'info', formatters: { level: levelCodeToLabel } },
  localFileDestination
);
