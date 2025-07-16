import * as logger from '@lib/logger';
import { number } from '@inquirer/prompts';
import type { DMTVData, ScoredResult } from '../types';

export default async function handleSimilarMatches(
                              source: DMTVData,
                              first: ScoredResult,
                              second: ScoredResult | undefined,
                              third: ScoredResult | undefined) {
    logger.say('Best match could not be determined with high confidence.')
    logger.say('Please select the item that best matches the entry.')
    logger.say('-------------------------------------------');
    logger.say('\x1b[1mSource Entry:\x1b[22m')
    logger.say(`\x1b[1mTitle:\x1b[22m ${source.title}`)
    logger.say(`\x1b[1mDirectors:\x1b[22m ${source.directors.toString()}`);
    logger.say(`\x1b[1mActors:\x1b[22m ${source.actors.toString()}`)

    printEntryData(first, 1);
    printEntryData(second, 2);
    printEntryData(third, 3);

    const choiceIndex = await number({
        message: "Please select the best matching entry. (0-3, 0 meaning no match)",
        default: 0,
        min: 0,
        max: 3,
        required: true,
        validate: (input) => {
          if (input > 4 || input < -1) {
            return "Selection out of bounds!"
          }
          return true;
        }
    })
    logger.debug(`user selected option ${choiceIndex}`);

    return choiceIndex;
}

function printEntryData(entry: ScoredResult | undefined, entryNumber: number) {
    if (entry === undefined) {
        return;
    }

    logger.say('-------------------------------------------');
    logger.say(`\x1b[1mEntry #${entryNumber}:\x1b[22m`);
    logger.say(`\x1b[1mID:\x1b[22m ${entry.id}`)
    logger.say(`\x1b[1mTitle:\x1b[22m ${entry.title}`)
    if (entry.altTitles !== undefined && entry.altTitles.length !== 0) {
        logger.say(`\x1b[1mAlternate Titles:\x1b[22m ${entry.altTitles.slice(0, 2).toString()}`)
    }
    if (entry.directors !== undefined) {
        logger.say(`\x1b[1mDirectors:\x1b[22m ${entry.directors.map(director => director.name).join(',')}`);
    }
    if (entry.actors !== undefined) {
        logger.say(`\x1b[1mActors:\x1b[22m ${entry.actors.map(actor => actor.name).join(',')}`)
    }
    logger.say(`\x1b[1mMatch Score:\x1b[22m ${entry.matchScore.overall}`)
}
