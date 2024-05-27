import { Benchmark } from "./benchmark";
import { ArticleGenerator } from "./document-generators/article-generator";
import { WikipediaArticleAbstractGenerator } from "./document-generators/wikipedia-article-abstract-generator";
import { Article } from "./documents/article";
import { WikipediaArticleAbstract } from "./documents/wikipedia-article-abstract";
import { QuickwitSearchEngine } from "./engines/quickwit";
import { logger } from "./logger";
import { allQueries } from "./query";

const quickwitArticles = new QuickwitSearchEngine<Article>({
  indexName: "articles",
  address: "http://localhost:7280/api/v1",
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
    address: "http://localhost:7280/api/v1",
  });
const wikipediaArticleAbstractBenchmark =
  Benchmark.create<WikipediaArticleAbstract>({
    ignoreUnsupportedQueries: true,
    queries,
    engines: [quickwitWikipediaArticleAbstract],
    documentCount: 200,
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
