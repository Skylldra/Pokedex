require("dotenv").config();
const express = require("express");
const { neon } = require("@neondatabase/serverless");

const app = express();
const PORT = process.env.PORT || 3000;

// Datenbankverbindung
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    console.error("ERROR: Keine DATABASE_URL gefunden! Stelle sicher, dass sie in Render als Environment Variable gesetzt ist.");
    process.exit(1);
}
const sql = neon(databaseUrl);

// **Pokédex-Anzeige**
app.get("/pokedex/:user", async (req, res) => {
    const user = req.params.user;
    const result = await sql`SELECT * FROM pokedex WHERE twitch_username = ${user} ORDER BY pokemon_id ASC;`;

    let pokedexHTML = `
    <h2>Pokédex von ${user}</h2>
    <div class="pokedex-container">
        <ul>`;
    
    if (result.length === 0) {
        pokedexHTML += "<li>Keine Pokémon gefunden!</li>";
    } else {
        result.forEach(entry => {
            const shinyText = entry.shiny ? "✨ Shiny!" : "";
            const status = entry.gefangen ? "Gefangen" : "Nicht gefangen";
            pokedexHTML += `<li>#${entry.pokemon_id} ${entry.pokemon_name} - ${status} ${shinyText}</li>`;
        });
    }

    pokedexHTML += `</ul></div>`;
    res.send(pokedexHTML);
});

// **Server starten**
app.listen(PORT, () => console.log(`✅ Pokédex-Server läuft auf Port ${PORT}`));
