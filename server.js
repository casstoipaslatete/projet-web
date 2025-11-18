const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const port = 3000;

// Database setup
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults if the database file is empty
db.defaults({ scores: [] }).write();

// Serve static files from the 'public' directory and other root folders
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'games')));
app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'styles')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to save score
app.post('/api/score', express.json(), (req, res) => {
    const { game, score } = req.body;
    console.log(`Received score for ${game}: ${score}`);
    
    // Save score to the database
    db.get('scores')
      .push({ game, score, date: new Date().toISOString() })
      .write();
      
    res.status(200).json({ message: 'Score saved successfully' });
});

// API endpoint to get scores for a game
app.get('/api/scores/:game', (req, res) => {
    const { game } = req.params;
    const scores = db.get('scores')
                     .filter({ game })
                     .orderBy('score', 'desc')
                     .take(10) // Get top 10 scores
                     .value();
    res.json(scores);
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
