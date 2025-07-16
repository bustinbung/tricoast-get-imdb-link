/* Imports */
import { readSourceData, writeOutput } from '@lib/handleFileSystem';
import * as tmdb from '@lib/queryTMDB';
import * as matchScore from '@lib/matchScore';
import * as logger from '@lib/logger';
import handleSimilarMatches from '@lib/handleSimilarMatches';
import type { ScoredResult } from './types';

/* Options */
const maxPages = 5;
// 0.75 allows either director or actor score to be 0 with perfect title match.
const scoreThreshold = 0.75;

let sourceFilePath = '';
// Read CLI arguments, ignoring first 2 (`node` and path to file)
const argv = process.argv.slice(2);
for (let arg of argv) {
    if (arg.indexOf('--file') !== -1) {
        const fileArg = arg.split('=')[1]
        if (fileArg === undefined) {
            throw new Error('source data file path is undefined!');
        }
        sourceFilePath = fileArg;
    }
}
if (sourceFilePath === '') {
    throw new Error('source data file path is undefined!');
}

/* Main entrypoint */
logger.say('intializing...');
const sourceData = await readSourceData(sourceFilePath);
for (let sourceEntry of sourceData) {
    /* Entry pre-processing */
    logger.say('-------------------------------------------');
    logger.say(`processing ${sourceEntry.title}...`);
    const results: ScoredResult[] = [];
    let page = 1;
    let pages = 1;
    let skipping = false;

    /* Entry comparison loop */
    do {
        logger.debug('searching tmdb...')
        const searchResults = await tmdb.searchMovie(sourceEntry.title, page);
        if (searchResults === undefined) {
            logger.error('tmdb search failed! skipping...');
            break;
        }
        if (page <= 1) {
            pages = Math.min(searchResults.total_pages, maxPages);
        }
        const movies = searchResults.results;
        if (movies === undefined || movies.length === 0) {
            logger.error(`no matching results for ${sourceEntry.title}! skipping...`)
            break;
        }

        /* Main scoring logic */
        for (let searchEntry of movies) {
            logger.debug(`matching against ${searchEntry.id}:${searchEntry.title}`)

            /* TODO: refactor to class? avoids this instantiation
             * boilerplate & can add custom toString() method */
            let currentEntry: ScoredResult = {
                id: searchEntry.id,
                title: searchEntry.title,
                altTitles: [],
                directors: [],
                actors: [],
                matchScore: {
                    title: 0,
                    director: 0,
                    actor: 0,
                    overall: 0
                }
            }

            /* Title matching */
            const altTitles = await tmdb.getAltTitles(searchEntry.id);
            if (searchEntry.title === undefined) {
                logger.warn(`no title for ${searchEntry.id}!`)
            } else if (altTitles === undefined || altTitles.titles === undefined) {
                logger.debug(`no alternative titles for ${searchEntry.id}`)
            } else {
                const allTitles = [searchEntry.title, searchEntry.original_title!];
                altTitles.titles.forEach(entry => {
                    if (entry.title !== undefined) {
                        allTitles.push(entry.title);
                    }
                })
                logger.debug('comparing titles...')
                currentEntry.matchScore.title = matchScore.title(sourceEntry.title, allTitles);
            }

            const credits = await tmdb.getCredits(searchEntry.id);
            if (credits === undefined) {
                logger.error(`credits fetch failed for ${searchEntry.id}:${searchEntry.title}!`);
                continue;
            }

            /* Director matching */
            if (credits.crew === undefined || credits.crew.length === 0) {
                logger.warn(`no crew for ${searchEntry.id}:${searchEntry.title}!`);
            } else {
                currentEntry.directors = credits.crew.filter((crewMember) => {
                    return crewMember.job == "Director";
                })
                logger.debug('comparing directors...')
                currentEntry.matchScore.director = matchScore.people(sourceEntry.directors, currentEntry.directors);
            }

            /* Cast matching */
            if (credits.cast === undefined || credits.cast.length === 0) {
                logger.warn(`no cast for ${searchEntry.id}:${searchEntry.title}!`);
            } else {
                currentEntry.actors = credits.cast.slice(0, 9);
                logger.debug('comparing actors...')
                currentEntry.matchScore.actor = matchScore.people(sourceEntry.actors, currentEntry.actors);
            }

            currentEntry.matchScore.overall = (
                currentEntry.matchScore.title * 10 +
                currentEntry.matchScore.director * 5 +
                currentEntry.matchScore.actor * 5
            ) / 20;
            logger.debug(`match score ${currentEntry.matchScore.overall} for ${searchEntry.id}:${searchEntry.title}`)

            if (currentEntry.matchScore.overall > 0.95) {
                logger.debug(`\x1b[1;92mgreat match found with score ${currentEntry.matchScore.overall}. skipping...\x1b[22;0m`);
                skipping = true;
            }

            results.push(currentEntry);
        }

        page++;
    } while (skipping === false && page < pages);

    /* Post-search logic */
    if (results.length === 0) {
        logger.error('no results saved! skipping...');
        /* TODO: figure out if it's possible to refactor this so it runs always
         * to avoid error with forgetting to add a newline */
        writeOutput('\n');
        continue;
    }

    const resultsByScore = results.toSorted((a, b) => {
        return b.matchScore.overall - a.matchScore.overall;
    });

    const firstMatchResult = resultsByScore[0];
    if (firstMatchResult === undefined) {
        logger.error('best match could not be determined! skipping...');
        writeOutput('\n');
        continue;
    }
    if (firstMatchResult.matchScore.overall < scoreThreshold) {
        logger.error('best match had a low score! skipping...');
        writeOutput('\n');
        continue;
    }

    // If top 2 or 3 choices have similar scores, ask user to pick one.
    let bestMatch = firstMatchResult;
    let matchDelta = Infinity;
    if (resultsByScore[2] !== undefined) {
        matchDelta = firstMatchResult.matchScore.overall - resultsByScore[2].matchScore.overall;
    } else if (resultsByScore[1] !== undefined) {
        matchDelta = firstMatchResult.matchScore.overall - resultsByScore[1].matchScore.overall;
    }

    if (matchDelta < 0.1 && firstMatchResult.matchScore.overall !== 1) {
        const userSelectedIndex = await handleSimilarMatches(sourceEntry, firstMatchResult, resultsByScore[1], resultsByScore[2]);
        if (userSelectedIndex === 0) {
            logger.error(`user did not select a match. skipping...`);
            writeOutput('\n');
            continue;
        }
        const userSelectedMatch = resultsByScore[userSelectedIndex];
        if (userSelectedMatch !== undefined) {
            bestMatch = userSelectedMatch;
        }
    }

    const bestMatchExternalIds = await tmdb.getExternalIds(bestMatch.id);
    if (bestMatchExternalIds === undefined) {
        logger.error(`external id search failed for ${firstMatchResult.id}:${firstMatchResult.title}! skipping...`);
        writeOutput('\n');
        continue;
    }
    if (bestMatchExternalIds.imdb_id === null || bestMatchExternalIds.imdb_id === "") {
        logger.error(`no IMDB ID for ${firstMatchResult.id}:${firstMatchResult.title}! skipping...`);
        writeOutput('\n');
        continue;
    }
    logger.debug(`found IMDB id ${bestMatchExternalIds.imdb_id}`);
    const imdbLink = `https://www.imdb.com/title/${bestMatchExternalIds.imdb_id}`;
    writeOutput(imdbLink + '\n');
}

logger.say('finished!');
