import { NextRequest, NextResponse } from "next/server";
import { getForm, updateForm, SequenzyError, type FormBlock, type FormTheme } from "@/lib/sequenzy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const form = await getForm(id);
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return NextResponse.json(form);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load form" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    listIds?: string[];
    tagIds?: string[];
    blocks?: FormBlock[];
    buttonText?: string;
    successMessage?: string;
    redirectUrl?: string;
    theme?: FormTheme;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  try {
    const result = await updateForm(id, body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}
