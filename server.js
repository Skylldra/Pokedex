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

// Pokémon-Daten laden
const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, "pokedex.json"), "utf-8"));

// Route: Neues Pokémon fangen
app.get("/catch", (req, res) => {
  const username = req.query.username;
  const pokemonId = parseInt(req.query.pokemonId);

  if (!username || isNaN(pokemonId)) {
    return res.status(400).send("Ungültige Anfrage: Nutzername oder Pokémon-ID fehlt.");
  }

  const shiny = Math.random() < 0.1; // 10% Chance für ein Shiny-Pokémon
  const caughtAt = new Date().toISOString();

  const userFile = path.join(userDir, `${username.toLowerCase()}.csv`);

  // Prüfen, ob die Benutzerdatei existiert, wenn nicht, erstellen
  if (!fs.existsSync(userFile)) {
    fs.writeFileSync(userFile, "PokemonID,Shiny,CaughtAt\n");
  }

  // Prüfen, ob das Pokémon bereits gefangen wurde
  const userData = fs.readFileSync(userFile, "utf-8")
    .split("\n")
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [id, shiny, date] = line.split(",");
      return { id: parseInt(id), shiny: shiny === "true", date };
    });

  const alreadyCaught = userData.find((p) => p.id === pokemonId);

  if (alreadyCaught) {
    return res.send(`${username} hat Pokémon Nr. ${pokemonId} bereits gefangen.`);
  }

  // Pokémon hinzufügen
  const newLine = `${pokemonId},${shiny},${caughtAt}\n`;
  fs.appendFileSync(userFile, newLine);

  const pokemonName = pokemonData.find((p) => p.id === pokemonId)?.name || "Unbekanntes Pokémon";
  res.send(`${username} hat ${pokemonName} (${pokemonId}) gefangen! ${shiny ? "✨ Shiny! ✨" : ""}`);
});

// Route für den Benutzer-Pokédex
app.get("/:username", (req, res) => {
  const username = req.params.username.toLowerCase();
  const userFile = path.join(userDir, `${username}.csv`);

  // Prüfen, ob die Benutzerdatei existiert
  if (!fs.existsSync(userFile)) {
    return res.send(`<h1>Der Benutzer ${username} hat noch keinen Pokédex.</h1>`);
  }

  // Daten des Benutzers laden
  const userData = fs.readFileSync(userFile, "utf-8")
    .split("\n")
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [id, shiny, date] = line.split(",");
      return { id: parseInt(id), shiny: shiny === "true", date };
    });

  // Pokédex generieren
  let pokedexHTML = `
    <h1>Pokedex von ${username}</h1>
    <table border='1'>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Shiny</th>
        <th>Gefangen am</th>
      </tr>
  `;

  pokemonData.forEach((pokemon) => {
    const userPokemon = userData.find((p) => p.id === pokemon.id);
    const name = userPokemon ? pokemon.name : "????????";
    const shiny = userPokemon && userPokemon.shiny ? "Ja" : "Nein";
    const date = userPokemon ? userPokemon.date : "-";

    pokedexHTML += `
      <tr>
        <td>${pokemon.id}</td>
        <td>${name}</td>
        <td>${shiny}</td>
        <td>${date}</td>
      </tr>
    `;
  });
  pokedexHTML += "</table>";

  res.send(`
    <html>
      <head><title>Pokedex von ${username}</title></head>
      <body>
        ${pokedexHTML}
      </body>
    </html>
  `);
});

// Server starten
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
