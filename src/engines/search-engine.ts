import { Query } from "../query";

export interface SearchEngine<Document> {
  getEngineName(): string;
  clearExistingDocuments(): Promise<void>;
  insertBatch(batch: Document[]): Promise<void>;
  supportedQueries(): Query[];
  execute(query: Query): Promise<void>;
  waitIndexing(): Promise<void>;
}
