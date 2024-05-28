import { Command } from "@commander-js/extra-typings";
import { BenchmarkFactory } from "./benchmark-factory";
import { logger } from "./logger";

interface BenchmarkCommandArguments {
  benchmark: string;
  concurrency: string;
  requests: string;
  documents?: string;
  ingestChunkSize: string;

  datasetWikipediaArticleAbstractPath?: string;
}

async function runBenchmark(opts: BenchmarkCommandArguments) {
  const requests = Number(opts.requests);
  const concurrency = Number(opts.concurrency);
  const benchmark = BenchmarkFactory.create({
    benchmark: opts.benchmark,
    concurrency,
    datasets: {
      wikipediaArticleAbstractPath: opts.datasetWikipediaArticleAbstractPath,
    },
    documents: opts.documents ? Number(opts.documents) : undefined,
    ingestChunkSize: Number(opts.ingestChunkSize),
    requests,
  });

  try {
    await benchmark.run();
  } catch (err) {
    logger.error("Main error: %o", err instanceof Error ? err.stack : err);
  }
}

new Command()
  .command("benchmark", { isDefault: true })
  .option(
    "-b, --benchmark <wikipedia-article-abstract | articles>",
    undefined,
    "wikipedia-article-abstract"
  )
  .option("-c, --concurrency <number>", undefined, "50")
  .option("-r, --requests <number>", "Search requests to be executed.", "1000")
  .option(
    "--dataset-wikipedia-article-abstract-path <string>",
    "Path to Wikipedia article abstract xml dump"
  )
  .option("--documents <number>")
  .option(
    "--ingest-chunk-size <number>",
    "Document indexing chunk size.",
    "1000"
  )
  .action(runBenchmark)
  .parse();
