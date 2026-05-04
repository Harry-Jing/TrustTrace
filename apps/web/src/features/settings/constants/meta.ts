// `__APP_VERSION__` and `__APP_BUILD_DATE__` are injected by Vite's `define`
// in vite.config.ts and replaced at build time as static string literals.
/* eslint-disable @typescript-eslint/naming-convention */
declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;
/* eslint-enable @typescript-eslint/naming-convention */

export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __APP_BUILD_DATE__;
export const APP_BUILD_LABEL = "trace";
export const APP_TAGLINE = "evidence-first credibility";
export const APP_RELEASE_TAG = "mvp";
