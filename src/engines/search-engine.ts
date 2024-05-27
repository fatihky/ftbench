import { Query } from "../query";

export interface SearchEngine<Document> {
  engineName(): string;
  insertBatch(batch: Document[]): Promise<void>;
  supportedQueries(): Query[];
  execute(query: Query): Promise<void>;
}
