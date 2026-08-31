/**
 * Único ponto de acoplamento da Application Layer com o Core Domain.
 * Nenhum outro arquivo em `packages/application` importa de
 * `packages/core` diretamente — todos importam daqui (`./domain-kernel`
 * ou `../domain-kernel`, etc.). Isso existe por dois motivos:
 *
 * 1. Torna a regra "Application → Domain, nunca o contrário" auditável
 *    por um único grep (`grep -rL "domain-kernel" ... | grep core`) em
 *    vez de precisar caçar imports espalhados por dezenas de arquivos.
 * 2. Se `packages/core` virar um pacote npm de verdade publicado
 *    (`@suplecheck/core`) em vez de um caminho relativo dentro do mesmo
 *    monorepo, só esta linha muda.
 *
 * Nada é re-exportado "por via das dúvidas" — só o que algum Port, Use
 * Case, Mapper, Factory ou Policy desta camada realmente usa.
 */
export * from "../../core/src/index";
