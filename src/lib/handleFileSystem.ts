import fs from "fs";
import path from "path"
import util from "node:util";
import { fileURLToPath } from 'url';
import parse from "csv-parser";
import { format } from 'date-fns';
import * as logger from './logger';
import type { DMTVData } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "../..");

const argv = process.argv.slice(2);
let outputDebugFile = false;
for (let arg of argv) {
    if (arg.indexOf('--debug') !== -1) {
        outputDebugFile = true;
    }
}

export function readSourceData(sourceFilePath: string): Promise<DMTVData[]> {
    let absoluteFilePath = '';
    if (sourceFilePath.charAt(0) === "/") {
        absoluteFilePath = sourceFilePath;
    } else {
        absoluteFilePath = path.join(__dirname, sourceFilePath);
    }
    if (absoluteFilePath === '') {
        throw new Error('filepath is invalid!')
    }

    const sourceData: DMTVData[] = [];
    return new Promise((resolve, reject) => {
        logger.debug(`reading file at ${absoluteFilePath}`);
        fs.createReadStream(absoluteFilePath)
            .pipe(parse())
            .on('data', (data) => {
                const entry = {
                    title: data.Title,
                    directors: data.Directors.split(",")
                        .map((item: string) => item.trim()),
                    actors: data.Actors.split(",")
                        .map((item: string) => item.trim())
                }
                sourceData.push(entry);
            })
            .on('end', () => {
                logger.debug('file read successful')
                resolve(sourceData);
            })
            .on('error', reject);
    })
}

const dateCreated = new Date();
const resultFolderPath = path.join(__dirname, `out/`);
let resultFileName = `results${format(dateCreated, "yyyyMMddHHmmss")}.log`;
if (logger.isProd === false) {
    resultFileName = `results${format(dateCreated, "yyyyMMddHHmmss")}.debug.log`;
}
const resultFilePath = path.join(resultFolderPath, resultFileName);
const logFolderPath = path.join(__dirname, `out/`);
const logFileName = `log${format(dateCreated, "yyyyMMddHHmmss")}.log`;
const logFilePath = path.join(logFolderPath, logFileName);

export function writeOutput(content: string) {
    if (fs.existsSync(resultFolderPath) === false) {
        fs.mkdirSync(resultFolderPath);
    }
    if (fs.existsSync(resultFilePath) === false) {
        fs.writeFile(resultFilePath, '', { flag: 'a+' }, () => {});
    }

    fs.appendFile(resultFilePath, util.stripVTControlCharacters(content), () => {});
}

export function writeLog(content: string) {
    if (logger.isProd === false || outputDebugFile === false) {
        return;
    }
    if (fs.existsSync(logFolderPath) === false) {
        fs.mkdirSync(logFolderPath);
    }
    if (fs.existsSync(logFilePath) === false) {
        fs.writeFile(logFilePath, '', { flag: 'a+' }, () => {});
    }

    fs.appendFile(logFilePath, util.stripVTControlCharacters(content), () => {});
}
