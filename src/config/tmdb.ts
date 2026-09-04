/**
 * TMDB credentials. The app ships with a built-in default API Read Access
 * Token so it works out of the box — no setup required.
 *
 * API Key:   43f51076b8c5ebb939a14c6b41009f64
 * Access Token (used as Bearer auth):
 */
const TMDB_DEFAULT_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0M2Y1MTA3NmI4YzVlYmI5MzlhMTRjNmI0MTAwOWY2NCIsIm5iZiI6MTc4NTcxODUyOC44NzEsInN1YiI6IjZhNmZlNzAwODg5MTM1NjRiOTliZTZiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.6W3zvT-lqIA7Nryc63Eoj035UwGSH8OlOnZ5I2Ewgy0";

export function getApiKey(): string {
  return TMDB_DEFAULT_ACCESS_TOKEN;
}
