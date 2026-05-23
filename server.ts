import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const MONGODB_URI =
    'mongodb+srv://caonguyen281009:caonguyen2009@cluster0.qicty.mongodb.net/mark';

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

const AppDataSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true },
        subjects: { type: Array, default: [] },
        weeks: { type: Array, default: [] },
    },
    { timestamps: true }
);

const AppData = mongoose.model('AppData', AppDataSchema);

// API Routes

app.get('/api/data', async (req, res) => {
    try {
        let data = await AppData.findOne({ userId: 'default' });

        if (!data) {
            data = await AppData.create({
                userId: 'default',
                subjects: [],
                weeks: [],
            });
        }

        res.json({
            subjects: data.subjects,
            weeks: data.weeks,
        });
    } catch (err: any) {
        res.status(500).json({
            error: err.message,
        });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { subjects, weeks } = req.body;

        await AppData.findOneAndUpdate(
            { userId: 'default' },
            { subjects, weeks },
            {
                upsert: true,
                new: true,
            }
        );

        res.json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({
            error: err.message,
        });
    }
});

async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
            },
            appType: 'spa',
        });

        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');

        // Static files
        app.use(express.static(distPath));

        // SPA fallback for React Router
        app.use((req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

startServer();