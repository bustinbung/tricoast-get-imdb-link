import compare from 'string-comparison';
import * as logger from '@lib/logger';
import type { CreditsCrew, CreditsCast } from '../types';

export function title(sourceTitle: string, compareTitles: string[]) {
    // Compare first title. It should exist as we've done a check before passing into the function.
    let similarity = compare.diceCoefficient.similarity(sourceTitle, compareTitles[0] ?? "");
    logger.debug(`title similarity ${similarity} for ${sourceTitle}, ${compareTitles[0]}`);

    if (similarity === 1) {
        logger.debug('\x1b[1;92mperfect title match. skipping...\x1b[22;0m')
        return similarity;
    }

    // Returns highest score found
    let matchScore = similarity;
    // Start from 1 because we've already compared the first item.
    for (let i = 1; i < compareTitles.length; i++) {
        if (compareTitles[i] === undefined) {
            continue;
        }

        similarity = compare.diceCoefficient.similarity(sourceTitle, compareTitles[i] ?? "");
        logger.debug(`title similarity ${similarity} for ${sourceTitle}, ${compareTitles[i]}`);
        if (similarity === 1) {
            matchScore = 1;
            logger.debug('\x1b[1;92mperfect title match. skipping...\x1b[22;0m')
            break;
        } else if (similarity > matchScore) {
            matchScore = similarity;
        }
    }

    return matchScore;
}

export function people(sourcePeople: string[], searchPeople: NonNullable<CreditsCrew> | NonNullable<CreditsCast>) {
    let matchScore = 0;
    let averageSum = 0;
    for (let sourcePerson of sourcePeople) {
        let similaritySum = 0;
        for (let searchPerson of searchPeople) {
            if (searchPerson.name === undefined) {
                continue;
            }

            const similarity = compare.diceCoefficient.similarity(sourcePerson, searchPerson.name);
            logger.debug(`name similarity ${similarity} for ${sourcePerson}, ${searchPerson.name}`);
            if (similarity === 1) {
                matchScore = 1;
                logger.debug('\x1b[1;92mperfect name match. skipping...\x1b[22;0m')
                break;
            }

            // Some ugly averaging logic here, but it works
            similaritySum += similarity;
        }

        averageSum += similaritySum / searchPeople.length;
    }

    if (matchScore != 1) {
        matchScore = averageSum / sourcePeople.length;
    }

    return matchScore;
}
