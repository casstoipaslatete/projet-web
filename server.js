const express = require('express');
const path = require('path');
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

// Create profile
app.post('/api/profile', async (req, res) => {
    try {
        const { pseudo = '', avatar = '😺', color = '#ffcc00' } = req.body;

        // Create new profile
        const profile = await prisma.profile.create({
            data: {
                pseudo,
                avatar,
                color
            }
        });

        res.status(201).json({ message: 'Profile created successfully.', profile });
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ message: 'Error creating profile.' });
    }
});

// Get profile
app.get('/api/profile/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid profile id.' });
        }

        const profile = await prisma.profile.findUnique({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        res.status(200).json({ message: 'Profile fetched successfully.', profile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile.' });
    }
});

// Update profile
app.post('/api/profile/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { pseudo, avatar, color } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid profile id.' });
        }

        const profile = await prisma.profile.findUnique({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        const profile_res = await prisma.profile.update({
            where: { id },
            data: {
                pseudo: pseudo !== undefined ? pseudo : undefined,
                avatar: avatar !== undefined ? avatar : undefined,
                color: color !== undefined ? color : undefined
            }
        });

        res.json({ message: 'Profile updated successfully.', profile_res });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile.' });
    }
});

// Delete profile
app.delete('/api/profile/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid profile id.' });
        }

        const profile = await prisma.profile.findUnique({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        const profile_res = await prisma.profile.delete({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        res.json({ message: 'Profile deleted successfully.', profile_res });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ message: 'Error deleting profile.' });
    }
});



// API endpoint to save score
app.post('/api/score', async (req, res) => {
    try {
        const { profileId, game, score } = req.body;

        if (!profileId || !game || score === undefined) {
            return res.status(400).json({ message: 'profileId, game, and score are required.' });
        }

        console.log(`Received score for ${game}: ${score} from profileId ${profileId}`);

        const savedScore = await prisma.score.create({
            data: {
                profileId: parseInt(profileId),
                game,
                score: parseInt(score)
            }
        });

        res.status(200).json({ message: 'Score saved successfully', score: savedScore });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ message: 'Error saving score.' });
    }
         
});

// API endpoint to get scores for a game (leaderboard)
app.get('/api/scores/:game', async (req, res) => {
    try {
        const { game } = req.params;

        const scores = await prisma.score.findMany({
                where: { game },
                include: {
                    profile: true
                },
                orderBy: { score: 'desc' },
                take: 10
            });

            res.status(200).json({ message: 'Scores fetched successfully', scores: scores });
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
                    profile: true
                },
                orderBy: { score: 'desc' },
                take: 10
            });
        }

        res.status(200).json({ message: 'Leaderboard fetched successfully', leaderboard: leaderboards });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching leaderboard.' });
    }
});

// Get scores for a profile
app.get('/api/profile/:profileId/scores', async (req, res) => {
    try {
        const profileId = parseInt(req.params.profileId);

        if (isNaN(profileId)) {
            return res.status(400).json({ message: 'Invalid profileId.' });
        }
        
        const scores = await prisma.score.findMany({
            where: { profileId },
            orderBy: { date: 'desc' }
        });

        res.status(200).json({ message: 'Scores fetched successfully', scores: scores });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching profile scores.' });
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
