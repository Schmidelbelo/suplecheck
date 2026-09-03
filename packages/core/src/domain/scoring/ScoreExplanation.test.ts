import { describe, it, expect } from "vitest";
import { rankCriteriaByImpact } from "./ScoreExplanation";

describe("rankCriteriaByImpact", () => {
  it("ordena por nota × peso (impacto real), não só pela nota isolada", () => {
    const ranked = rankCriteriaByImpact([
      { criterionId: "high-score-low-weight", score: 100, weight: 0.1 },
      { criterionId: "mid-score-high-weight", score: 60, weight: 0.5 },
    ]);

    // 100*0.1=10 vs 60*0.5=30 — o segundo critério pesou mais de verdade.
    expect(ranked[0]!.criterionId).toBe("mid-score-high-weight");
    expect(ranked[0]!.weightedImpact).toBe(30);
    expect(ranked[1]!.weightedImpact).toBe(10);
  });

  it("não muta o array original", () => {
    const original = [{ criterionId: "a", score: 50, weight: 0.5 }];
    const ranked = rankCriteriaByImpact(original);
    expect(ranked).not.toBe(original);
    expect(original).toHaveLength(1);
  });
});
