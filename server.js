const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware für JSON-Parsing
app.use(express.json());

// Ordner für Benutzerdateien
const userDir = path.join(__dirname, "user");
if (!fs.existsSync(userDir)) {
  fs.mkdirSync(userDir); // Ordner erstellen, falls nicht vorhanden
}

// Pokémon-Daten laden
const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, "pokedex.json"), "utf-8"));

// Route: Root-Route für die Übersicht
app.get("/", (req, res) => {
  res.send(`
    <h1>Willkommen beim Pokémon Pokédex!</h1>
    <p>Um deinen Pokédex zu sehen, besuche: <code>https://pokedex-dt48.onrender.com/&lt;username&gt;</code></p>
    <p>Um ein Pokémon zu fangen, sende eine Anfrage an: <code>/catch</code></p>
  `);
});

// Route: Daten empfangen und speichern
app.post("/", (req, res) => {
  const { username, pokemonId, pokemonName, caught, shiny } = req.body;

  if (!username || !pokemonId || !pokemonName) {
    return res.status(400).send("Ungültige Anfrage: username, pokemonId oder pokemonName fehlt.");
  }

  const userFile = path.join(userDir, `${username.toLowerCase()}.csv`);

  // Benutzerdatei erstellen, falls nicht vorhanden
  if (!fs.existsSync(userFile)) {
    fs.writeFileSync(userFile, "PokemonID,PokemonName,Caught,Shiny\n");
  }

  // Neue Zeile in die CSV hinzufügen
  const newLine = `${pokemonId},${pokemonName},${caught},${shiny}\n`;
  fs.appendFileSync(userFile, newLine);

  res.send("Pokémon erfolgreich gespeichert!");
});

// Route: Benutzer-Pokédex anzeigen
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
      const [id, name, shiny, caught] = line.split(",");
      return { id: parseInt(id), name, shiny: shiny === "true", caught: caught === "true" };
    });

  // Pokédex generieren
  let pokedexHTML = `
    <h1>Pokedex von ${username}</h1>
    <table border='1'>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Shiny</th>
        <th>Gefangen</th>
      </tr>
  `;

  pokemonData.forEach((pokemon) => {
    const userPokemon = userData.find((p) => p.id === pokemon.id);
    const name = userPokemon ? userPokemon.name : "????????";
    const shiny = userPokemon && userPokemon.shiny ? "Ja" : "Nein";
    const caught = userPokemon && userPokemon.caught ? "Ja" : "Nein";

    pokedexHTML += `
      <tr>
        <td>${pokemon.id}</td>
        <td>${name}</td>
        <td>${shiny}</td>
        <td>${caught}</td>
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
