const express = require('express');
const mysql = require('mysql2');
const app = express();

// Verbindung zur Datenbank
const db = mysql.createConnection({
    host: 'localhost', // oder deine Render-DB-URL
    user: 'root',
    password: 'dein_passwort',
    database: 'pokemon_catch'
});

// Middleware, um statische Dateien bereitzustellen (z. B. index.html)
app.use(express.static(__dirname));

// API-Endpunkt für Pokédex-Daten
app.get('/api/pokedex', (req, res) => {
    const user = req.query.user;
    if (!user) {
        return res.status(400).json({ error: 'Benutzername fehlt!' });
    }

    // Abfrage: Alle Pokémon für den Benutzer
    const query = `
        SELECT p.pokemon_id, p.name, 
               COALESCE(c.is_shiny, FALSE) AS shiny, 
               COALESCE(c.pokemon_id IS NOT NULL, FALSE) AS caught
        FROM pokedex p
        LEFT JOIN caught_pokemon c 
        ON p.pokemon_id = c.pokemon_id AND c.user_id = ?
    `;

    db.query(query, [user], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Datenbankfehler!' });
        }
        res.json(results);
    });
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
