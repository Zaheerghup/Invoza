import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// GET all items/accounts for the current user's company
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.itemAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(items);
  } catch (err) {
    console.error("Fetch Items Error:", err);
    return NextResponse.json({ error: "Failed to fetch items and accounts" }, { status: 500 });
  }
}

// POST create a new item/account
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await prisma.company.findFirst({
      where: { userId: user.id }
    });

    if (!company) {
      return NextResponse.json({ error: "Company profile required first" }, { status: 400 });
    }

    const body = await request.json();
    const { type, name, description } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    // Generate systemCode manually to ensure uniqueness per company/type
    // A sequence approach would be better, but count is sufficient for MVP
    const count = await prisma.itemAccount.count({
      where: { companyId: company.id, type }
    });
    
    const prefix = type === "Item" ? "ITEM" : "ACC";
    const systemCode = `${prefix}-${String(count + 1).padStart(3, '0')}`;

    const item = await prisma.itemAccount.create({
      data: {
        systemCode,
        type,
        name,
        description,
        userId: user.id,
        companyId: company.id,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("Create Item Error:", err);
    return NextResponse.json({ error: "Failed to create item or account" }, { status: 500 });
  }
}
