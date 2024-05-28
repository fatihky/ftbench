import { logger } from "../logger";
import { Query } from "../query";
import { SearchEngine } from "./search-engine";

export interface OpenSearchSearchEngineParams {
  address: string;
  indexName: string;
}

export interface IndexStatsResponse {
  indices: {
    [name: string]: {
      total: {
        docs: { count: number; deleted: number };
      };
    };
  };
}

const childLogger = logger.child({}, { msgPrefix: "opensearch: " });

export class OpenSearchSearchEngine<Doc extends { id: string | number }>
  implements SearchEngine<Doc>
{
  private readonly address: string;
  private readonly indexName: string;

  constructor(params: OpenSearchSearchEngineParams) {
    this.address = params.address;
    this.indexName = params.indexName;
  }

  getEngineName(): string {
    return "opensearch";
  }

  async clearExistingDocuments(): Promise<void> {
    childLogger.info("Clearing existing documents");

    try {
      const resp = await fetch(`${this.address}/${this.indexName}`, {
        method: "DELETE",
      });

      if (resp.status !== 200 && resp.status !== 404) {
        let body: any = null;

        try {
          body = await resp.json();
        } catch {}

        throw new Error(
          `opensearch: Cannot clear the index ${
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

      throw new Error("opensearch: Cannot clear existing documents.");
    }
  }

  async execute(query: Query): Promise<void> {
    const queryTerm = "music";
    const resp = await fetch(
      `${this.address}/${this.indexName}/_search?q=${encodeURIComponent(
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

    const resp = await fetch(`${this.address}/_bulk`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body:
        docs
          .flatMap((doc) => [
            JSON.stringify({ create: { _index: this.indexName, _id: doc.id } }),
            JSON.stringify(doc),
          ])
          .join("\n") + "\n",
    });

    if (resp.status !== 200 && resp.status !== 202) {
      childLogger.debug("got a non-successful status code: %d", resp.status);
      childLogger.debug("response body: %O", await resp.json());
    }

    childLogger.debug("Done inserting batch of %d documents...", docs.length);
  }

  async waitIndexing({ numDocs }: { numDocs: number }) {
    childLogger.debug("Wait for indexing to be done");

    for (;;) {
      const resp = await fetch(`${this.address}/${this.indexName}/_stats`);

      const body: IndexStatsResponse = await resp.json();

      if (body.indices[this.indexName].total.docs.count >= numDocs) {
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
