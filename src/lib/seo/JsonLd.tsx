/**
 * Componente separado dos geradores de schema (`schema.ts`) de propósito:
 * arquivos de teste puros (`schema.test.ts`) importam só as funções de
 * dados, nunca este componente — mantém aquele arquivo livre de JSX.
 */

/**
 * Escapa `<`, `>` e `&` no JSON serializado antes de injetar via
 * `dangerouslySetInnerHTML`. Sem isto, um campo de texto vindo do banco
 * (nome/descrição de produto, por exemplo) contendo `</script><script>`
 * fecharia a tag `<script type="application/ld+json">` e injetaria
 * HTML/script arbitrário na página (stored XSS) — os valores usados aqui
 * (nome de produto, marca, descrição) vêm de dados persistidos, não de
 * literais de código, então não podem ser tratados como confiáveis.
 */
function escapeJsonForScriptTag(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScriptTag(JSON.stringify(data)) }}
    />
  );
}
