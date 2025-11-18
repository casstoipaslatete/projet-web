const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

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
    // Here you would save the score to a database
    res.status(200).json({ message: 'Score saved successfully' });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
