const express = require('express');
const path = require('path');
//const low = require('lowdb');
//const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = 3000;

// Database setup with Prisma
const prisma = new PrismaClient();

// Serve static files from the 'public' directory and other root folders
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'games')));
app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'styles')));

// Middleware to parse JSON bodies
app.use(express.json());

// --- API Routes ---

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        //const existingUser = db.get('users').find({ username }).value();
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);

        // db.get('users').push({ username, password: hashedPassword, createdAt: new Date().toISOString() }).write();

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                profile : { 
                    create: {}
                }
            }
        });

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user.' });
    }

});

// User login
app.post('/api/login', async (req, res) => {

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        //const user = db.get('users').find({ username }).value();

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        // In a real app, you would create a JWT or session here
        res.status(200).json({ message: 'Login successful.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // const user = db.get('users').find({ username }).value();

        const user = await prisma.user.findUnique({
            where: { username }
            //include: { profile: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return public user data (don't send the password)
        res.json({
            username: user.username,
            createdAt: user.createdAt
            //profile: user.profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user.' });
    }
});

// Get or create profile for current user
app.get('/api/profile', async (req, res) => {
    try {
        const userId = req.body.userId; 
        const profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching profile.' });
    }
});

// Update profile
app.post('/api/profile', async (req, res) => {
    try {
        const userId = req.body.userId || 1; // À adapter avec session/JWT
        const { pseudo, avatar, color } = req.body;

        const profile = await prisma.profile.update({
            where: { userId },
            data: {
                pseudo,
                avatar,
                color
            }
        });

        res.json({ message: 'Profile updated successfully.', profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile.' });
    }
});


// API endpoint to save score
app.post('/api/score', async (req, res) => {
    try {
        const { game, score, username } = req.body; // Assuming username might be sent
        console.log(`Received score for ${game} from ${username || 'anonymous'}: ${score}`);

        // db.get('scores')
        //   .push({ game, score, username, date: new Date().toISOString() })
        //   .write();

        const savedScore = await prisma.score.create({
            data: {
                game,
                score,
                userId: userId || null,
                username: username || 'anonymous'
            }
        });

        res.status(200).json({ message: 'Score saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving score.' });
    }
         
});

// API endpoint to get scores for a game (leaderboard)
app.get('/api/scores/:game', async (req, res) => {
    try {
        const { game } = req.params;
        // const scores = db.get('scores')
        //                  .filter({ game })
        //                  .orderBy('score', 'desc')
        //                  .take(10) // Get top 10 scores
        //                  .value();

        const scores = await prisma.score.findMany({
                where: { game },
                include: {
                    user: {
                        include: { profile: true }
                    }
                },
                orderBy: { score: 'desc' },
                take: 10
            });

            res.json(scores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching scores.' });
    }
});

// Get leaderboard for all games
app.get('/api/leaderboard', async (req, res) => {
    try {
        const games = await prisma.score.groupBy({
            by: ['game']
        });

        const leaderboards = {};
        for (const g of games) {
            leaderboards[g.game] = await prisma.score.findMany({
                where: { game: g.game },
                include: {
                    user: {
                        include: { profile: true }
                    }
                },
                orderBy: { score: 'desc' },
                take: 10
            });
        }

        res.json(leaderboards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching leaderboard.' });
    }
});

// Get scores for current user
app.get('/api/user/:userId/scores', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const scores = await prisma.score.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { date: 'desc' }
        });

        res.json(scores);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user scores.' });
    }
});


// --- Client-side Routing Catch-all ---
// This route must be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
