# Full-Text Search Engine Benchmark

This repository contains a code for benchmarking different full-text search engines with various document types, and queries. Query concurrency and execution count can be configured as per your needs.

### Setting up

1. Download the dataset for your benchmark, if necessary.

   a. For the Wikipedia Article Abstract benchmark, you need to download proper xml dump. See [dumps.wikimedia.org](https://dumps.wikimedia.org/).
   Example: You might download `enwiki-20240520-abstract.xml.gz` from [dumps.wikimedia.org/enwiki/20240520/](https://dumps.wikimedia.org/enwiki/20240520/)

2. Create indexes on your full-text search engine, if necessary.
   a. `quickwit` search engine requires you to create indexes before the inserts.
   b. `meilisearch` search engine does not require you to create index before the inserts.

### Benchmarking

After setting up your search engines, you can fire a benchmark with:

```shell
npm start
```

```txt
Usage:  benchmark [options]

Options:
  -b, --benchmark <wikipedia-article-abstract | articles>   (default: "wikipedia-article-abstract")
  -c, --concurrency <number>                                (default: "50")
  -r, --requests <number>                                  Search requests to be executed. (default: "1000")
  --dataset-wikipedia-article-abstract-path <string>               Path to Wikipedia article abstract xml dump
  -h, --help                                               display help for command
```
