import { NextRequest, NextResponse } from "next/server";
import { createForm, createList, listForms, SequenzyError } from "@/lib/sequenzy";

export async function GET() {
  try {
    const result = await listForms();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load forms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    // Sequenzy forms require a list; we manage one hidden list per form.
    const list = await createList(`EliteReach form: ${body.name}`);
    const result = await createForm({
      name: body.name,
      listIds: [list.id],
      tagIds: body.tagId ? [body.tagId] : undefined,
      headline: body.headline,
      description: body.description,
      buttonText: body.buttonText,
      showFirstName: body.showFirstName,
      successMessage: body.successMessage,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}
