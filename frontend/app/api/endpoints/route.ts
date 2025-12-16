import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { access } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const apiDir = join(process.cwd(), "app", "api");
    const entries = await readdir(apiDir, { withFileTypes: true });
    
    const endpoints: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "endpoints") {
        // Check if directory has a route.ts file
        const routeFile = join(apiDir, entry.name, "route.ts");
        try {
          await access(routeFile);
          endpoints.push(`/api/${entry.name}`);
        } catch {
          // route.ts doesn't exist, skip
        }
      }
    }
    
    return NextResponse.json({ endpoints });
  } catch (error) {
    console.error("Error reading API endpoints:", error);
    // Fallback to known endpoints if file system read fails
    return NextResponse.json({ 
      endpoints: ["/api/premium", "/api/twitter"] 
    });
  }
}

