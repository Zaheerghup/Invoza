import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await prisma.company.findFirst({ where: { userId: user.id } });
    if (!company) return NextResponse.json({ error: "No company found" }, { status: 404 });

    const refData = await prisma.fbrReferenceData.findMany({
      where: { companyId: company.id }
    });

    // Group the data by type to make it easy for the frontend to consume
    const grouped = {
      PROVINCE: refData.filter((r) => r.type === "PROVINCE"),
      UOM: refData.filter((r) => r.type === "UOM"),
      HS_CODE: refData.filter((r) => r.type === "HS_CODE"),
      DOC_TYPE: refData.filter((r) => r.type === "DOC_TYPE")
    };

    return NextResponse.json(grouped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
