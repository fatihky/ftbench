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

  engineName(): string {
    return "meilisearch";
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
    const resp = await fetch(
      `${this.address}/indexes/${this.indexName}/documents?primaryKey=id`,
      {
        method: "POST",
        headers: { "content-type": "application/x-ndjson" },
        body: docs.map((doc) => JSON.stringify(doc)).join("\n"),
      }
    );

    if (resp.status !== 200) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }
  }

  supportedQueries(): Query[] {
    return [Query.SingleWord];
  }
}
