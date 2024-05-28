import { logger } from "../logger";
import { Query } from "../query";
import { SearchEngine } from "./search-engine";

export interface QuickwitSearchEngineParams {
  address: string;
  indexName: string;
}

interface QuickwitIndexDescribeBody {
  index_id: string;
  index_uri: string;
  num_published_splits: number;
  size_published_splits: number;
  num_published_docs: number;
  size_published_docs_uncompressed: number;
  timestamp_field_name: string | null;
  min_timestamp: string | null;
  max_timestamp: string | null;
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
    childLogger.info("Clearing existing documents");

    const resp = await fetch(
      `${this.address}/api/v1/indexes/${this.indexName}/clear`,
      { method: "PUT" }
    );

    if (resp.status !== 200) {
      const body = await resp.json();

      throw new Error(
        `quickwit: Cannot clear the index ${this.indexName}. Response status=${
          resp.status
        }, body=${JSON.stringify(body)}`
      );
    }

    childLogger.info("Done clearing existing documents");
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

  async waitIndexing({ numDocs }: { numDocs: number }): Promise<void> {
    childLogger.debug("Wait for indexing to be done");

    for (;;) {
      const resp = await fetch(
        `${this.address}/api/v1/indexes/${this.indexName}/describe`
      );

      if (resp.status !== 200) {
        let body: unknown = null;

        childLogger.debug(
          "Cannot check indexing status: Got a non-successful status code: %d",
          resp.status
        );

        try {
          body = await resp.json();
        } catch {}

        childLogger.debug("response body: %O", await resp.json());

        throw new Error("quickwit: index describe request failed.");
      }

      const body: QuickwitIndexDescribeBody = await resp.json();

      if (body.num_published_docs >= numDocs) {
        break;
      }

      childLogger.debug("Indexing is still in progress...");

      await new Promise((r) => setTimeout(r, 1000));
    }

    childLogger.debug("Indexing is done.");
  }
}
