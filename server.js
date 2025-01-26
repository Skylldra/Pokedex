const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Ordner für Benutzerdateien
const userDir = path.join(__dirname, "user");
if (!fs.existsSync(userDir)) {
  fs.mkdirSync(userDir); // Ordner erstellen, falls nicht vorhanden
}

// Pokémon-Daten (151 Pokémon mit Pokedex-Eintrag)
const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, "pokedex.json"), "utf-8"));

// Statische Dateien (z.B. index.html)
app.use(express.static("public"));

// Route für Benutzer-Pokédex
app.get("/:username", (req, res) => {
  const username = req.params.username.toLowerCase();
  const userFile = path.join(userDir, `${username}.csv`);

  // Prüfen, ob die Benutzerdatei existiert
  if (!fs.existsSync(userFile)) {
    // Benutzerdatei erstellen, wenn sie nicht existiert
    fs.writeFileSync(userFile, "PokemonID,Shiny,CaughtAt\n");
  }

  // Daten des Benutzers lesen
  const userData = fs.readFileSync(userFile, "utf-8")
    .split("\n")
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [id, shiny, date] = line.split(",");
      return { id: parseInt(id), shiny: shiny === "true", date };
    });

  // HTML für den Pokédex generieren
  let pokedexHTML = "<h1>Pokedex</h1><table border='1'><tr><th>#</th><th>Name</th><th>Shiny</th><th>Pokedex-Eintrag</th></tr>";
  pokemonData.forEach((pokemon) => {
    const userPokemon = userData.find((p) => p.id === pokemon.id);
    const name = userPokemon ? pokemon.name : "????????";
    const shiny = userPokemon && userPokemon.shiny ? "Ja" : "Nein";
    const entry = userPokemon ? pokemon.entry : "???";

    pokedexHTML += `
      <tr>
        <td>${pokemon.id}</td>
        <td>${name}</td>
        <td>${shiny}</td>
        <td>${entry}</td>
      </tr>
    `;
  });
  pokedexHTML += "</table>";

  res.send(`
    <html>
      <head><title>Pokedex von ${username}</title></head>
      <body>
        <h1>Pokedex von ${username}</h1>
        ${pokedexHTML}
      </body>
    </html>
  `);
});

// Server starten
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
