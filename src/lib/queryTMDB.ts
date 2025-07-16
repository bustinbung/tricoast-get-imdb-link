import { Fetcher, Middleware } from "openapi-typescript-fetch";
import { paths } from "@api/tmdb.d";
import * as logger from '@lib/logger';
import 'dotenv/config';

const api_key = process.env.API_KEY;
const fetcher = Fetcher.for<paths>();
const logMiddleware: Middleware = async (url, init, next) => {
    logger.debug(`fetching ${url}`);
    const response = await next(url, init);
    logger.debug(`fetched ${url}`);
    return response;
}
fetcher.configure({
    baseUrl: "https://api.themoviedb.org",
    init: {
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${api_key}`
        }
    },
    use: [logMiddleware]
})

const fetchSearchMovie = fetcher.path('/3/search/movie').method('get').create();
const fetchGetCredits = fetcher.path('/3/movie/{movie_id}/credits').method('get').create();
const fetchGetExternalIds = fetcher.path('/3/movie/{movie_id}/external_ids').method('get').create();
const fetchGetAltTitles = fetcher.path('/3/movie/{movie_id}/alternative_titles').method('get').create();

export async function searchMovie(title: string, page = 1) {
    let data;
    try {
        const { status, data: searchResults } = await fetchSearchMovie({
            query: title,
            page
        });
        data = searchResults;
    } catch (e) {
        logger.error(e);
    }

    return data;
}

export async function getCredits(tmdbId: number) {
    let data;
    try {
        const { status, data: credits } = await fetchGetCredits({
            movie_id: tmdbId,
        });
        data = credits;
    } catch (e) {
        logger.error(e);
    }

    return data;
}

export async function getExternalIds(tmdbId: number) {
    let data;
    try {
        const { status, data: externalIds } = await fetchGetExternalIds({
            movie_id: tmdbId,
        });
        data = externalIds;
    } catch (e) {
        logger.error(e);
    }

    return data;
}

export async function getAltTitles(tmdbId: number) {
    let data;
    try {
        const { status, data: altTitles } = await fetchGetAltTitles({
            movie_id: tmdbId,
        });
        data = altTitles;
    } catch (e) {
        logger.error(e);
    }

    return data;
}
