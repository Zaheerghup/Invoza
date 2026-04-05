import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFbrReferenceList } from "@/lib/fbr";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const company = await prisma.company.findFirst({
      where: { userId: user.id }
    });

    if (!company) {
      return NextResponse.json({ error: "Company profile not found." }, { status: 404 });
    }

    const env = company.fbrEnvironment || "Sandbox";
    let apiUrl = env === "Production" ? company.fbrProductionUrl : company.fbrSandboxUrl;
    let apiToken = env === "Production" ? company.fbrProductionToken : company.fbrSandboxToken;

    if (env === "Sandbox" && !apiToken && company.API_Token) {
      apiToken = company.API_Token; // legacy fallback
    }

    if (!apiUrl || !apiToken) {
      return NextResponse.json({ 
        error: `FBR ${env} credentials not configured. Please add the FBR API URL and Token in Settings.` 
      }, { status: 400 });
    }

    const typesToSync = ["PROVINCE", "DOC_TYPE", "UOM", "HS_CODE"];
    
    let totalSynced = 0;
    const syncResults: Record<string, string> = {};

    for (const type of typesToSync) {
      const items = await fetchFbrReferenceList(apiUrl, apiToken, type);
      
      if (items.length > 0) {
        // Clear existing for this company/type
        await prisma.fbrReferenceData.deleteMany({
          where: { companyId: company.id, type }
        });

        // Insert new
        await prisma.fbrReferenceData.createMany({
          data: items.map(item => ({
            companyId: company.id,
            type,
            code: item.code,
            name: item.name
          }))
        });
        
        syncResults[type] = `Synced ${items.length} items.`;
        totalSynced += items.length;
      } else {
         // Create some mocks so testing UI is visually functional if API endpoints fail/unreachable
         if (process.env.NODE_ENV === "development") {
             const mockItems = type === "PROVINCE" 
               ? [ {code: "PUN", name: "Punjab"}, {code: "SIND", name: "Sindh"} ]
               : type === "UOM"
               ? [ {code: "NOS", name: "Numbers, pieces, units"}, {code: "KGS", name: "Kilograms"} ]
               : [ {code: "MOCK1", name: "Mock Data 1"} ];
               
               await prisma.fbrReferenceData.deleteMany({ where: { companyId: company.id, type } });
               await prisma.fbrReferenceData.createMany({
                 data: mockItems.map(item => ({ companyId: company.id, type, code: item.code, name: item.name }))
               });
               syncResults[type] = `API failed, generated mock fallback.`;
               totalSynced += mockItems.length;
         } else {
             syncResults[type] = `Failed or empty response from FBR.`;
         }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync operation completed. Processed ${totalSynced} records.`,
      results: syncResults
    });

  } catch (err: any) {
    console.error("FBR Sync Error:", err);
    return NextResponse.json({ error: `Sync failed: ${err.message}` }, { status: 500 });
  }
}
