/**
 * Único ponto de acoplamento da Infrastructure Layer com a Application
 * Layer. Todo o resto de `packages/infrastructure` importa Ports, DTOs e
 * o `UseCaseFactory` daqui — nunca diretamente de
 * `../../application/src/...`. Mesmo raciocínio do
 * `domain-kernel.ts` da Application: torna "Infrastructure → Application,
 * nunca o contrário" e "Infrastructure nunca conhece Application por
 * caminhos divergentes" verificável com um grep único (ver ARCHITECTURE.md §7).
 */
export * from "../../application/src/index";
