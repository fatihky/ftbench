import { createReadStream } from "fs";
import * as flow from "xml-flow";
import {
  WikipediaArticleAbstract,
  WikipediaArticleAbstractSubLink,
} from "../documents/wikipedia-article-abstract";
import { DocumentGenerator } from "./document-generator";

interface RawLink {
  anchor: string;
  link: string;
}

interface RawDoc {
  $name: "doc";
  abstract: string;
  title: string;
  url: string;
  links: RawLink | RawLink[];
}

function rawLinkToSublink(raw: RawLink): WikipediaArticleAbstractSubLink {
  return { text: raw.anchor, url: raw.link };
}

export class WikipediaArticleAbstractGenerator
  implements DocumentGenerator<WikipediaArticleAbstract>
{
  private nextId = 1;

  constructor(private readonly xmlDumpPath: string) {}

  async generate(
    count?: number | undefined
  ): Promise<WikipediaArticleAbstract[]> {
    const docs: WikipediaArticleAbstract[] = [];

    await new Promise((resolve, reject) => {
      const readStream = createReadStream(this.xmlDumpPath);
      const xmlStream = flow(readStream);

      xmlStream.on("error", reject);
      xmlStream.on("end", resolve);
      readStream.on("close", resolve);

      xmlStream.on("tag:doc", (raw: RawDoc) => {
        docs.push({
          id: this.nextId++,
          abstract: raw.abstract,
          links: Array.isArray(raw.links)
            ? raw.links.map(rawLinkToSublink)
            : [rawLinkToSublink(raw.links)],
          title: raw.title,
          url: raw.url,
        });

        if (count && docs.length >= count) {
          readStream.close();
        }
      });
    });

    return docs;
  }
}
