# tricoast-get-imdb-link

Attempts to find an IMDB link for a movie with data given.

## Installation

Install packages using npm.

``` sh
npm install
```

Then run however you like to execute TypeScript.

``` sh
tsx src/index.ts --env-file=.env --file=<PATH_TO_CSV_FILE> [--debug]
```

## Usage

The script expects an `.env` file with an `API_KEY`. Change `.env.tmpl` to provide your own key, and rename the file to `.env`.

The script (in its current form) also expects a CSV file. Provide the file path with the `--file` flag. Relative and absolute paths are supported, but you may need to mess around with dot notation to get it to find the correct location. The CSV file should contain three columns: title, directors, and actors, as specified in `src/types.ts`.

``` typescript
type DMTVData = {
    title: string,
    directors: string[],
    actors: string[]
}
```

## Details

The program executes as follows:
1. Read the source data file into memory.
2. For each entry in the source data file, search TMDB for entries with the same title.
3. For each entry returned from TMDB, calculate a match score (more below).
4. Find the best match and return its IMDB link.

Currently, the program checks against the title, any alternative titles, directors, and actors, but (I hope) the program logic is easily extensible enough to add additional checks for release years, runtime, and other metadata as long as someone can implement a normalized score algorithm for each new property.

The program will output the results to `out/`.

## Troubleshooting

You can get a debug log by passing the `--debug` flag when running the program.

Open an issue on GitHub if you have issues.
