import { logger } from "../logger";
import { Query } from "../query";
import { SearchEngine } from "./search-engine";

export interface MeiliSearchSearchEngineParams {
  address: string;
  indexName: string;
}

const childLogger = logger.child({}, { msgPrefix: "meilisearch: " });

export class MeiliSearchSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly address: string;
  private readonly indexName: string;

  constructor(params: MeiliSearchSearchEngineParams) {
    this.address = params.address;
    this.indexName = params.indexName;
  }

  getEngineName(): string {
    return "meilisearch";
  }

  async clearExistingDocuments(): Promise<void> {
    childLogger.info("Clearing existing documents");

    try {
      const resp = await fetch(
        `${this.address}/indexes/${this.indexName}/documents`,
        { method: "DELETE" }
      );

      if (resp.status !== 202) {
        let body: any = null;

        try {
          body = await resp.json();
        } catch {}

        throw new Error(
          `meilisearch: Cannot clear the index ${
            this.indexName
          }. Response status=${resp.status}, body=${JSON.stringify(body)}`
        );
      }

      childLogger.info("Done clearing existing documents");
    } catch (err) {
      childLogger.error(
        "Cannot clear existing documents: %s",
        err instanceof Error ? err.message : JSON.stringify(err)
      );

      throw new Error("meilisearch: Cannot clear existing documents.");
    }
  }

  async execute(query: Query): Promise<void> {
    const queryTerm = "music";
    const resp = await fetch(
      `${this.address}/indexes/${this.indexName}/search?q=${encodeURIComponent(
        queryTerm
      )}`
    );

    if (resp.status !== 200) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }
  }

  async insertBatch(docs: Doc[]): Promise<void> {
    childLogger.debug("Inserting batch of %d documents...", docs.length);

    const resp = await fetch(
      `${this.address}/indexes/${this.indexName}/documents?primaryKey=id`,
      {
        method: "POST",
        headers: { "content-type": "application/x-ndjson" },
        body: docs.map((doc) => JSON.stringify(doc)).join("\n"),
      }
    );

    if (resp.status !== 200 && resp.status !== 202) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }

    childLogger.debug("Done inserting batch of %d documents...", docs.length);
  }

  async waitIndexing() {
    childLogger.debug("Wait for indexing to be done");

    for (;;) {
      const resp = await fetch(
        `${this.address}/tasks?statuses=enqueued,processing`
      );

      const body: { results: unknown[] } = await resp.json();

      if (body.results.length === 0) {
        break;
      }

      childLogger.debug("Indexing is still in progress...");

      await new Promise((r) => setTimeout(r, 1000));
    }

    childLogger.debug("Indexing is done.");
  }

  supportedQueries(): Query[] {
    return [Query.SingleWord];
  }
}
