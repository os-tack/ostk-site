// Single source of truth for the latest published ostk version.
// Bump on release: edit LATEST_VERSION, build, commit.
//
// LATEST_VERSION must match the most recent tag on
// https://github.com/os-tack/ostk.ai/releases (a binary, not just
// a haystack source tag — those move ahead of shipped binaries).

export const LATEST_VERSION = "4.4.2";
export const LATEST_TAG = `v${LATEST_VERSION}`;
export const RELEASE_URL = `https://github.com/os-tack/ostk.ai/releases/tag/${LATEST_TAG}`;
