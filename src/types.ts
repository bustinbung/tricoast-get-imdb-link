/* Global type declarations */
import { operations } from "@api/tmdb";

export type ScoredResult = {
    id: number,
    title: string | undefined,
    altTitles: string[] | undefined,
    directors: CreditsCrew,
    actors: CreditsCast,
    matchScore: {
        title: number,
        director: number,
        actor: number,
        overall: number
    }
}

export type CreditsCrew = operations["movie-credits"]['responses']['200']['content']["application/json"]['crew'];
export type CreditsCast = operations["movie-credits"]['responses']['200']['content']["application/json"]['cast'];

export type DMTVData = {
    title: string,
    directors: string[],
    actors: string[]
}
