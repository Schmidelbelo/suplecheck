import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createLeadSchema } from "@/modules/leads/validators/lead.schema";
import { leadService } from "@/modules/leads/services/lead.service";
import { trackServerEvent } from "@/modules/analytics/services/analytics.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createLeadSchema.parse(body);

    const lead = await leadService.create(input);
    trackServerEvent("lead_captured", { source: input.source });

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", issues: error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    console.error("[api/leads] erro inesperado", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
