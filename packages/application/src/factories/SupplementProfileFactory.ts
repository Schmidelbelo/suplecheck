import { SupplementProfile } from "../domain-kernel";
import type { SupplementRecord } from "../ports/SupplementRepositoryPort";

/**
 * Deriva o `SupplementProfile` do Domain (só id/categorySlug/brandSlug —
 * o mínimo para calcular um Índice) a partir de um `SupplementRecord`
 * (a forma rica que a Application persiste, com nome/atributos/slug).
 * Nunca o contrário: o Domain não sabe compor um `SupplementRecord`.
 */
export const SupplementProfileFactory = {
  fromRecord(record: SupplementRecord): SupplementProfile {
    return SupplementProfile.of(record.id, record.categorySlug, record.brandSlug);
  },
};
