export interface WikipediaArticleAbstractSubLink {
  text: string;
  url: string;
}

export interface WikipediaArticleAbstract {
  id: number;
  title: string;
  url: string;
  abstract: string;
  links: WikipediaArticleAbstractSubLink[];
}
