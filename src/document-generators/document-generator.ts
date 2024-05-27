export abstract class DocumentGenerator<Document> {
  // pass nothing or zero to let document generator to decide
  abstract generate(count?: number): Promise<Document[]>;
}
