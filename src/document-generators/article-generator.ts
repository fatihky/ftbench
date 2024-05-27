import { Article } from "../documents/article";
import { faker } from "@faker-js/faker";
import { DocumentGenerator } from "./document-generator";

export class ArticleGenerator extends DocumentGenerator<Article> {
  private nextId = 1;

  async generate(amount: number): Promise<Article[]> {
    return Array.from({ length: amount }).map(() => ({
      id: this.nextId++,
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs({ min: 3, max: 8 }),
      created_at: Math.floor(Date.now() / 1000),
    }));
  }
}
