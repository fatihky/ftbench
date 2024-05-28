import { Benchmark } from "./benchmark";
import { ArticleGenerator } from "./document-generators/article-generator";
import { WikipediaArticleAbstractGenerator } from "./document-generators/wikipedia-article-abstract-generator";
import { Article } from "./documents/article";
import { WikipediaArticleAbstract } from "./documents/wikipedia-article-abstract";
import { MeiliSearchSearchEngine } from "./engines/meilisearch";
import { QuickwitSearchEngine } from "./engines/quickwit";
import { allQueries } from "./query";

interface BenchmarkFactoryParams {
  benchmark: string;
  requests: number;
  concurrency: number;
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

        return Benchmark.create<Article>({
          ignoreUnsupportedQueries: false,
          queries: allQueries,
          engines: [meilisearchArticles, quickwitArticles],
          documentCount: 100000,
          documentGenerator: new ArticleGenerator(),
          queryExecutorParams: { concurrency: 10, repeats: 10 },
        });
      }

      case "wikipedia-article-abstract": {
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
        const wikipediaArticleAbstractGenerator =
          new WikipediaArticleAbstractGenerator(
            "/Users/fatih/Downloads/enwiki-20220820-abstract.xml"
          );

        return Benchmark.create<WikipediaArticleAbstract>({
          ignoreUnsupportedQueries: true,
          queries: allQueries,
          engines: [
            meilisearchWikipediaArticleAbstract,
            quickwitWikipediaArticleAbstract,
          ],
          documentCount: 200000,
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
