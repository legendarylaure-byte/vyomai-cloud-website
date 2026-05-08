import "dotenv/config";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { visitorStatsTable } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function resetStats() {
    console.log("Resetting visitor stats...");
    try {
        // Try using the storage method first if available via class
        if ('resetTotalVisitors' in storage) {
            await storage.resetTotalVisitors();
            console.log("Stats reset via storage method.");
        } else {
            // Direct DB reset fallback for DatabaseStorage if method missing from interface/class
            // (Though we saw it in IStorage, let's be safe)
            await db.delete(visitorStatsTable);
            console.log("Stats reset via direct DB delete.");
        }
        console.log("Successfully reset visitor stats to 0.");
    } catch (error) {
        console.error("Error resetting stats:", error);
    }
    process.exit(0);
}

resetStats();
