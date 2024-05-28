import * as assert from "assert";
import { Benchmark } from "./benchmark";
import { ArticleGenerator } from "./document-generators/article-generator";
import { WikipediaArticleAbstractGenerator } from "./document-generators/wikipedia-article-abstract-generator";
import { Article } from "./documents/article";
import { WikipediaArticleAbstract } from "./documents/wikipedia-article-abstract";
import { MeiliSearchSearchEngine } from "./engines/meilisearch";
import { OpenSearchSearchEngine } from "./engines/opensearch";
import { QuickwitSearchEngine } from "./engines/quickwit";
import { allQueries } from "./query";

interface BenchmarkFactoryParams {
  benchmark: string;
  requests: number;
  concurrency: number;
  ingestChunkSize?: number;
  documents?: number;

  datasets?: {
    // wikipedia article abstract xml dump path
    wikipediaArticleAbstractPath?: string;
  };
}

export class BenchmarkFactory {
  static create(params: BenchmarkFactoryParams): Benchmark<unknown> {
    switch (params.benchmark) {
      case "articles": {
        const meilisearchArticles = new MeiliSearchSearchEngine<Article>({
          indexName: "wikipedia-article-abstract",
          address: "http://localhost:7700",
        });
        const quickwitArticles = new QuickwitSearchEngine<Article>({
          indexName: "articles",
          address: "http://localhost:7280",
        });
        const opensearchArticles = new OpenSearchSearchEngine<Article>({
          indexName: "articles",
          address: "http://localhost:9200",
        });

        return Benchmark.create<Article>({
          ingestChunkSize: params.ingestChunkSize,
          ignoreUnsupportedQueries: false,
          queries: allQueries,
          engines: [opensearchArticles, meilisearchArticles, quickwitArticles],
          documentCount: params.documents ?? 100000,
          documentGenerator: new ArticleGenerator(),
          queryExecutorParams: { concurrency: 10, repeats: 10 },
        });
      }

      case "wikipedia-article-abstract": {
        const wikipediaArticleAbstractPath =
          params.datasets?.wikipediaArticleAbstractPath;
        const quickwitWikipediaArticleAbstract =
          new QuickwitSearchEngine<WikipediaArticleAbstract>({
            indexName: "wikipedia-article-abstract",
            address: "http://localhost:7280",
          });
        const meilisearchWikipediaArticleAbstract =
          new MeiliSearchSearchEngine<WikipediaArticleAbstract>({
            indexName: "wikipedia-article-abstract",
            address: "http://localhost:7700",
          });
        const opensearchWikipediaArticleAbstract =
          new OpenSearchSearchEngine<WikipediaArticleAbstract>({
            indexName: "wikipedia-article-abstract",
            address: "http://localhost:9200",
          });

        assert(wikipediaArticleAbstractPath);

        const wikipediaArticleAbstractGenerator =
          new WikipediaArticleAbstractGenerator(wikipediaArticleAbstractPath);

        return Benchmark.create<WikipediaArticleAbstract>({
          ingestChunkSize: params.ingestChunkSize,
          ignoreUnsupportedQueries: true,
          queries: allQueries,
          engines: [
            opensearchWikipediaArticleAbstract,
            meilisearchWikipediaArticleAbstract,
            quickwitWikipediaArticleAbstract,
          ],
          documentCount: params.documents,
          documentGenerator: wikipediaArticleAbstractGenerator,
          queryExecutorParams: {
            concurrency: params.concurrency,
            repeats: params.requests,
          },
        });
      }

      default:
        throw new Error(`Unknown benchmark: "${params.benchmark}"`);
    }
  }
}
