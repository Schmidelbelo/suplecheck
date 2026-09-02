import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import { createContactMessageSchema } from "@/modules/contact/validators/contact.schema";
import { contactService } from "@/modules/contact/services/contact.service";
import { trackServerEvent } from "@/modules/analytics/services/analytics.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createContactMessageSchema.parse(body);

    const message = await contactService.create(input);
    trackServerEvent("contact_message_sent", { subject: input.subject });

    return NextResponse.json({ id: message.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", issues: error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    console.error("[api/contact] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
