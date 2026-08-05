/**
 * Scheduled jobs (offer escalation, missed-visit flagging, notification purge)
 * are DB-polling crons. Run against a scale-to-zero database (Neon) with no
 * real traffic, they keep compute awake 24/7 and rack up charges even when the
 * app has no users.
 *
 * So every cron is OFF unless CRONS_ENABLED=true. Enable it in production at
 * launch (Railway env var); leave it unset pre-launch and for local dev, and
 * Neon autosuspends when idle.
 */
export function cronsEnabled(): boolean {
  return process.env.CRONS_ENABLED === 'true';
}
