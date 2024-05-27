import { Query } from "../query";

export interface SearchEngine<Document> {
  getEngineName(): string;
  insertBatch(batch: Document[]): Promise<void>;
  supportedQueries(): Query[];
  execute(query: Query): Promise<void>;
}
