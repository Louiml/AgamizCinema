export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

export interface TMDBMovie {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  original_language: string;
  adult?: boolean;
  popularity?: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  overview: string;
  poster_path: string | null;
  air_date?: string;
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  overview: string;
  still_path: string | null;
  air_date?: string;
  vote_average?: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official?: boolean;
}

export interface Cast {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path: string | null;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

/** A single title in a person's combined (movie + TV) credits. */
export interface PersonCombinedCredit {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  character?: string;
  job?: string;
  genre_ids?: number[];
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  combined_credits: { cast: PersonCombinedCredit[]; crew: PersonCombinedCredit[] };
}

export interface TMDBDetails {
  id: number;
  media_type?: MediaType;
  title?: string;
  name?: string;
  overview: string;
  tagline?: string;
  status?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  original_language?: string;
  homepage?: string | null;
  videos?: Video[];
  credits?: Credits;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface GenreListResponse {
  genres: Genre[];
}
