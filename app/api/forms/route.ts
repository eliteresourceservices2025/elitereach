import { NextRequest, NextResponse } from "next/server";
import { createForm, createList, listForms, updateForm, SequenzyError, type FormBlock, type FormTheme } from "@/lib/sequenzy";

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
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    tagIds?: string[];
    blocks?: FormBlock[];
    buttonText?: string;
    successMessage?: string;
    redirectUrl?: string;
    theme?: FormTheme;
  } | null;
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.blocks?.length) {
    return NextResponse.json({ error: "blocks[] is required" }, { status: 400 });
  }

  try {
    // Sequenzy forms require a list; we manage one hidden list per form.
    const list = await createList(`EliteReach form: ${body.name}`);
    const created = await createForm({
      name: body.name,
      listIds: [list.id],
      tagIds: body.tagIds,
      buttonText: body.buttonText,
      successMessage: body.successMessage,
      redirectUrl: body.redirectUrl,
      theme: body.theme,
    });
    // Custom field/layout blocks can only be set via a follow-up PATCH —
    // creation only accepts the simple template params above.
    const result = await updateForm(created.form.id, { blocks: body.blocks });
    return NextResponse.json({ form: result.form, embed: result.embed ?? created.embed }, { status: 201 });
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}
