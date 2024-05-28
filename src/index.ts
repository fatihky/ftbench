import { Command } from "@commander-js/extra-typings";
import { BenchmarkFactory } from "./benchmark-factory";
import { logger } from "./logger";

interface BenchmarkCommandArguments {
  benchmark: string;
  concurrency: string;
  requests: string;
}

const program = new Command()
  .command("benchmark", { isDefault: true })
  .option(
    "-b, --benchmark <wikipedia-article-abstract | articles>",
    undefined,
    "wikipedia-article-abstract"
  )
  .option("-c, --concurrency <number>", undefined, "50")
  .option("-r, --requests <number>", "Search requests to be executed.", "1000")
  .action(runBenchmark);

async function runBenchmark(opts: BenchmarkCommandArguments) {
  const requests = Number(opts.requests);
  const concurrency = Number(opts.concurrency);
  const benchmark = BenchmarkFactory.create({
    benchmark: opts.benchmark,
    concurrency,
    requests,
  });

  await benchmark.run();
}

async function main() {
  program.parse();
}

main().catch((err) => {
  console.log("Main error:", err);

  logger.error(
    "Main error: %s",
    err instanceof Error ? err.stack : err.toString()
  );
});
