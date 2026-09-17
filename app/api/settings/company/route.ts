import { NextRequest, NextResponse } from "next/server";
import { getCompanyProfile, updateCompanyProfile, SequenzyError, type CompanyProfilePatch } from "@/lib/sequenzy";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const company = await getCompanyProfile();
    return NextResponse.json(company);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to load company profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as CompanyProfilePatch | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const company = await updateCompanyProfile(body);
    return NextResponse.json(company);
  } catch (err) {
    if (err instanceof SequenzyError) return NextResponse.json(err.body, { status: err.status });
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 });
  }
}
