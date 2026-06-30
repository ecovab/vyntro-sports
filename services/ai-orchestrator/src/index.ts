/**
 * AI is processing-only: every function here takes verified facts already
 * persisted in Postgres and returns text/annotations. It never originates
 * scores, events, or news content — see docs/architecture for the rule.
 * Every Claude call is validated against the source facts and falls back to
 * a deterministic template on failure, so a bad generation never blocks or
 * corrupts the underlying data.
 */
export * from "./summarizeMatch";
export * from "./summarizeArticle";
export * from "./rankImportance";
export * from "./notificationCopy";
export * from "./cache";
