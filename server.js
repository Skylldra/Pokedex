require("dotenv").config();
const express = require("express");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

// Nutze die DATABASE_URL aus Render's Environment Variables
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
    console.error("ERROR: Keine DATABASE_URL gefunden! Stelle sicher, dass sie in Render als Environment Variable gesetzt ist.");
    process.exit(1);
}
const sql = neon(databaseUrl);
const app = express();

// Statische Dateien ausliefern (z.B. pokedex.html)
app.use(express.static(path.join(__dirname)));
// API-Endpunkt: Pokédex eines Twitch-Users abrufen
app.get("/api/pokedex/:username", async (req, res) => {
    const username = req.params.username;
    try {
        const result = await sql`
            SELECT pokemon_id, pokemon_name, gefangen, shiny 
            FROM pokedex
            WHERE twitch_username = ${username}
            ORDER BY pokemon_id;
        `;

        // **Hier wird der Status-Text angepasst**
        const formattedResult = result.map(entry => {
            const status = entry.gefangen 
                ? "✅ Im Pokéball gefangen!" 
                : "❌ Entkommen...";
            const shinyText = entry.shiny ? " ✨ Shiny!" : "";
            return `#${entry.pokemon_id} ${entry.pokemon_name} - ${status}${shinyText}`;
        });

        res.json(formattedResult);
    } catch (error) {
        console.error("Fehler beim Abrufen des Pokédex:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Weiterleitung von /username zu /pokedex.html
app.get("/:username", (req, res) => {
    res.sendFile(path.join(__dirname, "pokedex.html"));
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
