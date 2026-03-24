import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

// GET all customers for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (err: any) {
    console.error("Fetch Customers Error:", err);
    return NextResponse.json({ error: `Failed to fetch customers: ${err.message}` }, { status: 500 });
  }
}

// POST create a new customer for current user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { CustomerName, NTN_CNIC, Address, Province, BuyerType } = body;

    if (!CustomerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { 
        userId: user.id,
        CustomerName, 
        NTN_CNIC, 
        Address,
        Province: Province || "Punjab",
        BuyerType: BuyerType || "Unregistered" 
      },
    });

    return NextResponse.json(customer);
  } catch (err: any) {
    console.error("Create Customer Error:", err);
    return NextResponse.json({ error: `Failed to create customer: ${err.message}` }, { status: 500 });
  }
}
