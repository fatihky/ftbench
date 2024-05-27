import { logger } from "../logger";
import { Query } from "../query";
import { SearchEngine } from "./search-engine";

export interface QuickwitSearchEngineParams {
  address: string;
  indexName: string;
}

const childLogger = logger.child({}, { msgPrefix: "quickwit: " });

export class QuickwitSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly address: string;
  private readonly indexName: string;

  constructor(params: QuickwitSearchEngineParams) {
    this.address = params.address;
    this.indexName = params.indexName;
  }

  getEngineName(): string {
    return "quickwit";
  }

  async clearExistingDocuments(): Promise<void> {
    childLogger.debug("Clearing existing documents");

    const resp = await fetch(
      `${this.address}/api/v1/indexes/${this.indexName}/clear`,
      {
        method: "PUT",
      }
    );

    if (resp.status !== 200) {
      const body = await resp.json();

      throw new Error(
        `quickwit: Cannot clear the index ${this.indexName}. Response status=${
          resp.status
        }, body=${JSON.stringify(body)}`
      );
    }
  }

  async execute(query: Query): Promise<void> {
    const queryTerm = "music";
    const resp = await fetch(
      `${this.address}/api/v1/${
        this.indexName
      }/search?query=${encodeURIComponent(queryTerm)}`
    );

    if (resp.status !== 200) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }
  }

  async insertBatch(docs: Doc[]): Promise<void> {
    const resp = await fetch(
      `${this.address}/api/v1/${this.indexName}/ingest`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
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
