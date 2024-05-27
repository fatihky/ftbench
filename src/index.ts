import { Benchmark } from "./benchmark";
import { ArticleGenerator } from "./document-generators/article-generator";
import { WikipediaArticleAbstractGenerator } from "./document-generators/wikipedia-article-abstract-generator";
import { Article } from "./documents/article";
import { WikipediaArticleAbstract } from "./documents/wikipedia-article-abstract";
import { MeiliSearchSearchEngine } from "./engines/meilisearch";
import { QuickwitSearchEngine } from "./engines/quickwit";
import { logger } from "./logger";
import { allQueries } from "./query";

const quickwitArticles = new QuickwitSearchEngine<Article>({
  indexName: "articles",
  address: "http://localhost:7280",
});
const queries = allQueries;
const articleBenchmark = Benchmark.create<Article>({
  ignoreUnsupportedQueries: false,
  queries,
  engines: [quickwitArticles],
  documentCount: 100000,
  documentGenerator: new ArticleGenerator(),
  queryExecutorParams: { concurrency: 10, repeats: 10 },
});

const wikipediaArticleAbstractGenerator = new WikipediaArticleAbstractGenerator(
  "/Users/fatih/Downloads/enwiki-20220820-abstract.xml"
);

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
const wikipediaArticleAbstractBenchmark =
  Benchmark.create<WikipediaArticleAbstract>({
    ignoreUnsupportedQueries: true,
    queries,
    engines: [
      meilisearchWikipediaArticleAbstract,
      quickwitWikipediaArticleAbstract,
    ],
    documentCount: 200000,
    documentGenerator: wikipediaArticleAbstractGenerator,
    queryExecutorParams: { concurrency: 20, repeats: 200 },
  });

async function main() {
  await wikipediaArticleAbstractBenchmark.run();
}

main().catch((err) => {
  console.log("Main error:", err);

  logger.error(
    "Main error: %s",
    err instanceof Error ? err.stack : err.toString()
  );
});
