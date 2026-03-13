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
  } catch {
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
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
    const { NTN, BusinessName, Address, Province, API_Token } = body;

    if (!NTN || !BusinessName || !Address || !Province || !API_Token) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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

    const company = await prisma.company.upsert({
      where: { NTN },
      update: { BusinessName, Address, Province, API_Token, userId: user.id },
      create: { NTN, BusinessName, Address, Province, API_Token, userId: user.id },
    });

    return NextResponse.json(company);
  } catch {
    return NextResponse.json({ error: "Failed to save company" }, { status: 500 });
  }
}
