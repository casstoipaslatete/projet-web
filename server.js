const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Database setup
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults if the database file is empty
db.defaults({ scores: [], users: [] }).write();

// Serve static files from the 'public' directory and other root folders
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'games')));
app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'styles')));

// Middleware to parse JSON bodies
app.use(express.json());

// --- API Routes ---

// User registration
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const existingUser = db.get('users').find({ username }).value();
    if (existingUser) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.get('users').push({ username, password: hashedPassword, createdAt: new Date().toISOString() }).write();

    res.status(201).json({ message: 'User registered successfully.' });
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = db.get('users').find({ username }).value();
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
        return res.status(401).json({ message: 'Invalid password.' });
    }

    // In a real app, you would create a JWT or session here
    res.status(200).json({ message: 'Login successful.' });
});

// Get user profile
app.get('/api/users/:username', (req, res) => {
    const { username } = req.params;
    const user = db.get('users').find({ username }).value();

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Return public user data (don't send the password)
    res.json({
        username: user.username,
        createdAt: user.createdAt
    });
});


// API endpoint to save score
app.post('/api/score', (req, res) => {
    const { game, score, username } = req.body; // Assuming username might be sent
    console.log(`Received score for ${game} from ${username || 'anonymous'}: ${score}`);
    
    db.get('scores')
      .push({ game, score, username, date: new Date().toISOString() })
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

// --- Client-side Routing Catch-all ---
// This route must be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
