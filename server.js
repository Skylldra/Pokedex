require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

// Nutze die DATABASE_URL aus den GitHub Secrets
const databaseUrl = process.env.DATABASE_URL || "FALLBACK_URL_HIER";

if (!databaseUrl || databaseUrl.includes("FALLBACK_URL_HIER")) {
    console.error("ERROR: Keine DATABASE_URL gefunden! Stelle sicher, dass sie in GitHub Secrets gesetzt ist.");
    process.exit(1);
}

const sql = neon(databaseUrl);

// Beispiel für eine einfache Abfrage
(async () => {
    try {
        const test = await sql`SELECT 1`;
        console.log("Verbindung zur Datenbank erfolgreich!");
    } catch (error) {
        console.error("Fehler bei der Verbindung zur Datenbank:", error);
    }
})();
