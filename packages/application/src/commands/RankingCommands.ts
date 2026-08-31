export interface GenerateRankingCommand {
  readonly categorySlug: string;
  readonly methodologyId?: string; // se omitido, usa a metodologia ativa da categoria
}
