/**
 * Centralized SEO constants and helpers for playbook.golf.
 * Pages should import these instead of hardcoding strings.
 */

export const SITE_URL = "https://playbook.golf";
export const SITE_NAME = "Golf Playbook";
export const APP_NAME = "Golf Playbook: Strategy GPS";
export const APP_STORE_ID = "1557162395";
export const APP_STORE_URL = `https://apps.apple.com/us/app/golf-playbook/id${APP_STORE_ID}`;
export const TWITTER_HANDLE = "@GolfPlaybookApp";
export const OG_IMAGE = "/images/logo3d.png"; // 1200x630 recommended; swap when a dedicated OG asset is ready
export const OG_IMAGE_ALT = "Golf Playbook — strategy GPS app for golfers";
export const DEFAULT_LOCALE = "en_US";

export const PRIMARY_DESCRIPTION =
  "Golf Playbook is the strategy GPS app for golfers, parents, and coaches. Plan every shot with color-coded risk zones, AI caddie, weather-compensated dispersion, and personal updatable playbooks. Lower your score with smarter pre-round planning.";

export const PRIMARY_KEYWORDS = [
  "golf playbook",
  "golf strategy app",
  "golf GPS app",
  "golf course management app",
  "AI golf caddie",
  "golf yardage book app",
  "golf rangefinder app",
  "pre-round planning",
  "golf shot dispersion",
  "course strategy",
  "golf shot planner",
  "lower your handicap app",
];

/**
 * Build an absolute URL from a relative path.
 */
export function absoluteUrl(path: string = "/"): string {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/**
 * Build canonical metadata.alternates for a given path.
 */
export function canonical(path: string = "/") {
  return { canonical: absoluteUrl(path) };
}
