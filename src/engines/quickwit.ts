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

  engineName(): string {
    return "quickwit";
  }

  async execute(query: Query): Promise<void> {}

  async insertBatch(docs: Doc[]): Promise<void> {
    const resp = await fetch(`${this.address}/${this.indexName}/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: docs.map((doc) => JSON.stringify(doc)).join("\n"),
    });

    if (resp.status !== 200) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }
  }

  supportedQueries(): Query[] {
    return [Query.SingleWord];
  }
}
