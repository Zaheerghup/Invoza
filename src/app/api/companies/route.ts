import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// GET all companies for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(companies);
  } catch (err: any) {
    console.error("Fetch Companies Error:", err);
    return NextResponse.json({ error: `Failed to fetch companies: ${err.message}` }, { status: 500 });
  }
}

// POST create or update company for current user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      NTN, BusinessName, Address, Province, API_Token,
      fbrEnvironment, fbrSandboxUrl, fbrSandboxToken, fbrProductionUrl, fbrProductionToken
    } = body;

    if (!NTN || !BusinessName || !Address || !Province) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    // Check if NTN is already registered by another user
    const existing = await prisma.company.findUnique({
      where: { NTN },
    });

    if (existing && existing.userId && existing.userId !== user.id) {
      return NextResponse.json({ 
        error: "This NTN is already registered by another account. Please contact support if this is your business." 
      }, { status: 403 });
    }

    const companyData = {
      BusinessName, 
      Address, 
      Province, 
      API_Token: API_Token || "", // Optional fallback for now
      fbrEnvironment: fbrEnvironment || "Sandbox",
      fbrSandboxUrl: fbrSandboxUrl || null,
      fbrSandboxToken: fbrSandboxToken || null,
      fbrProductionUrl: fbrProductionUrl || null,
      fbrProductionToken: fbrProductionToken || null,
      userId: user.id
    };

    const company = await prisma.company.upsert({
      where: { NTN },
      update: companyData,
      create: { NTN, ...companyData },
    });

    return NextResponse.json(company);
  } catch (err: any) {
    console.error("Save Company Error:", err);
    return NextResponse.json({ error: `Failed to save company: ${err.message}` }, { status: 500 });
  }
}
