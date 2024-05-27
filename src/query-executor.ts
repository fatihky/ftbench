import { en } from "@faker-js/faker";
import { SearchEngine } from "./engines/search-engine";
import { Query } from "./query";

export interface QueryExecutorParams {
  concurrency: number;
  repeats: number;
}

export interface QueryExecutionResult<Doc> {
  query: Query;
  engine: SearchEngine<Doc>;
  totalDuration: number;
  queryDurations: number[];
  concurrency: number;
  repeats: number;
}

export class QueryExecutor {
  private readonly concurrency: number;
  private readonly repeats: number;

  constructor({ concurrency, repeats }: QueryExecutorParams) {
    this.concurrency = concurrency;
    this.repeats = repeats;
  }

  async execute<Doc>(
    engine: SearchEngine<Doc>,
    query: Query
  ): Promise<QueryExecutionResult<Doc>> {
    const queryDurations: number[] = [];
    const start = Date.now();
    let executionsLeft = this.repeats;

    await Promise.all(
      Array.from({ length: this.concurrency }).map(async () => {
        while (executionsLeft > 0) {
          const queryStart = Date.now();

          await engine.execute(query);

          const queryDuration = Date.now() - queryStart;

          queryDurations.push(queryDuration);
          executionsLeft--;
        }
      })
    );

    for (let i = 0; i < this.concurrency; i++) {}

    const totalDuration = Date.now() - start;

    return {
      concurrency: this.concurrency,
      repeats: this.repeats,
      engine,
      query,
      totalDuration,
      queryDurations,
    };
  }
}
