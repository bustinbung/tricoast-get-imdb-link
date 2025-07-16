import { writeLog } from '@lib/handleFileSystem';
import { format } from 'date-fns';

export const isProd = process.env.NODE_ENV === "production";
const prefix = '[jj/imdb]'

const argv = process.argv.slice(2);
let verbose = false;
for (let arg of argv) {
    if (arg.indexOf('--verbose') !== -1) {
        verbose = true;
    }
}

export function debug(msg: any) {
    if (isProd === false || verbose === true) {
        console.debug(`${prefix}(debug):\t${msg}`);
    }
    writeLog(`${format(new Date(), "yyyyMMdd:HHmmssSS")} ${prefix}(debug):\t${msg}\n`)
}

export function warn(msg: any) {
    console.warn(`\x1b[1;93m${prefix}(warn):\t${msg}\x1b[22;0m`);
    writeLog(`${format(new Date(), "yyyyMMdd:HHmmssSS")} ${prefix}(warn):\t${msg}\n`)
}

export function error(msg: any) {
    console.error(`\x1b[1;91m${prefix}(error):\t${msg}\x1b[22;0m`);
    writeLog(`${format(new Date(), "yyyyMMdd:HHmmssSS")} ${prefix}(error):\t${msg}\n`)
}

export function say(msg: any) {
    console.info(`${prefix}(log):\t\t${msg}`);
    writeLog(`${format(new Date(), "yyyyMMdd:HHmmssSS")} ${prefix}(log):\t${msg}\n`)
}
