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

app.post('/', (req, res) => {
    const { username, pokemonId, pokemonName, caught, shiny } = req.body;

    if (!username || !pokemonId) {
        return res.status(400).send('Ungültige Anfrage: username oder pokemonId fehlt.');
    }

    // Beispiel: Speichere die Daten in der CSV
    const userFile = path.join(userDir, `${username.toLowerCase()}.csv`);
    if (!fs.existsSync(userFile)) {
        fs.writeFileSync(userFile, 'PokemonID,PokemonName,Caught,Shiny\n');
    }

    const newLine = `${pokemonId},${pokemonName},${caught},${shiny}\n`;
    fs.appendFileSync(userFile, newLine);

    res.send('Pokémon erfolgreich gespeichert!');
});


  // Prüfen, ob das Pokémon bereits gefangen wurde
  const userData = fs.readFileSync(userFile, "utf-8")
    .split("\n")
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [id, name, shiny, date] = line.split(",");
      return { id: parseInt(id), name, shiny: shiny === "true", date };
    });

  const alreadyCaught = userData.find((p) => p.id === parseInt(pokemonId));

  if (alreadyCaught) {
    return res.send(`${username} hat Pokémon Nr. ${pokemonId} bereits gefangen.`);
  }

  // Pokémon hinzufügen, wenn gefangen
  const pokemonName = pokemonData.find((p) => p.id === parseInt(pokemonId))?.name || "Unbekanntes Pokémon";
  if (caught) {
    const newLine = `${pokemonId},${pokemonName},${shiny},${caughtAt}\n`;
    fs.appendFileSync(userFile, newLine);
    return res.send(`${username} hat ${pokemonName} (${pokemonId}) gefangen! ${shiny ? "✨ Shiny! ✨" : ""}`);
  } else {
    return res.send(`${username} konnte ${pokemonName} (${pokemonId}) nicht fangen.`);
  }
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
      const [id, name, shiny, date] = line.split(",");
      return { id: parseInt(id), name, shiny: shiny === "true", date };
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
    const name = userPokemon ? userPokemon.name : "????????";
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
