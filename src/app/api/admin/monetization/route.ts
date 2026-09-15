import { NextResponse } from "next/server";
import { getMonetizationAudit } from "@/modules/monetization/services/monetizationAudit.service";

/**
 * Auditoria de cobertura de monetização — protegida por `ADMIN_API_KEY`
 * (`/api/admin` é totalmente protegido em `src/middleware.ts`, inclusive
 * GET). Read-only, nunca escreve nada.
 */
export async function GET() {
  const audit = await getMonetizationAudit();
  return NextResponse.json(audit);
}
