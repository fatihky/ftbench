import { DocumentGenerator } from "./document-generators/document-generator";
import * as percentile from "percentile";
import { SearchEngine } from "./engines/search-engine";
import { logger } from "./logger";
import { Query } from "./query";
import { QueryExecutor, QueryExecutorParams } from "./query-executor";
import { en } from "@faker-js/faker";

export interface BenchmarkParams<Doc> {
  ingestChunkSize?: number;
  engines: SearchEngine<Doc>[];
  queries: Query[];
  ignoreUnsupportedQueries: boolean;
  documentCount?: number;
  documentGenerator: DocumentGenerator<Doc>;
  queryExecutorParams: QueryExecutorParams;
}

export class Benchmark<Doc> {
  private readonly ingestChunkSize = 1000;
  private engines: SearchEngine<Doc>[];
  private queries: Query[];
  private documentCount?: number;
  private documentGenerator: DocumentGenerator<Doc>;
  private readonly queryExecutor: QueryExecutor;

  private constructor(params: BenchmarkParams<Doc>) {
    this.engines = params.engines;
    this.queries = params.queries;
    this.documentCount = params.documentCount;
    this.documentGenerator = params.documentGenerator;
    this.queryExecutor = new QueryExecutor(params.queryExecutorParams);
    this.ingestChunkSize = 1000;
  }

  static create<D>(params: BenchmarkParams<D>): Benchmark<D> {
    if (params.ignoreUnsupportedQueries === false) {
      // ensure all of the queries supported by all the engines
      for (const query of params.queries) {
        for (const engine of params.engines) {
          const supported = engine.supportedQueries().includes(query);

          if (!supported) {
            throw new Error(
              `Query: ${query} is not supported by "${engine.getEngineName()}"`
            );
          }
        }
      }
    }

    return new Benchmark(params);
  }

  async run() {
    logger.info("Benchmark started");

    logger.info("Clearing indexes");

    for (const engine of this.engines) {
      await engine.clearExistingDocuments();
    }

    logger.info("Done clearing indexes");

    logger.info("Inserting documents");
    await this.insertDocs();
    logger.info("Done inserting documents");

    logger.info(
      "Executing queries. concurrency=%d, repeats=%d",
      this.queryExecutor.concurrency,
      this.queryExecutor.repeats
    );
    for (const query of this.queries) {
      logger.info("Executing query: %s", query);
      await this.executeQuery(query);
      logger.info("Done executing query: %s", query);
    }
    logger.info("Done running queries");
    logger.info("Benchmark done");
  }

  // execute query on the all search engines
  // if a any of the search engines does not support
  // the given query, it will be IGNORED
  private async executeQuery(query: Query) {
    for (const engine of this.engines) {
      if (!engine.supportedQueries().includes(query)) {
        logger.info(
          "Engine %s does not support query %s, skipping...",
          engine.getEngineName(),
          query
        );
        continue;
      }

      const { queryDurations, totalDuration } =
        await this.queryExecutor.execute(engine, query);

      logger.info(
        "Execution is done for the engine %s in %d ms",
        engine.getEngineName(),
        totalDuration
      );

      logger.info(
        "Engine: '%s', query time percentiles: %%5=%dms, %%20=%dms, %%50=%dms, %%75=%dms, %%90=%dms, %%95=%dms, %%99=%dms, %%100=%dms",
        engine.getEngineName(),
        percentile(5, queryDurations),
        percentile(20, queryDurations),
        percentile(50, queryDurations),
        percentile(75, queryDurations),
        percentile(90, queryDurations),
        percentile(95, queryDurations),
        percentile(99, queryDurations),
        percentile(100, queryDurations)
      );
    }
  }

  private async generateDocs(): Promise<Doc[]> {
    if (this.documentCount) {
      logger.info("Generating %d documents", this.documentCount);
    } else {
      logger.info("Generating documents");
    }

    const start = Date.now();
    const docs = await this.documentGenerator.generate(this.documentCount);
    const duration = Date.now() - start;

    if (this.documentCount) {
      logger.info(
        "Generated %d documents in %d ms",
        this.documentCount,
        duration
      );
    } else {
      logger.info("Generated documents in %d ms", duration);
    }

    return docs;
  }

  private async insertDocs() {
    const docs = await this.generateDocs();
    const chunks = makeChunks(docs, this.ingestChunkSize);

    logger.debug("Inserting %d docs in %d chunks.", docs.length, chunks.length);

    for (const chunk of chunks) {
      await Promise.all(
        this.engines.map((engine) => engine.insertBatch(chunk))
      );
    }

    logger.debug("Wait for engines to index the documents.");

    await Promise.all(
      this.engines.map((engine) =>
        engine.waitIndexing({ numDocs: docs.length })
      )
    );
  }
}

function makeChunks<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);

    chunks.push(chunk);
  }

  return chunks;
}
