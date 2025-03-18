// Import required modules
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';

// Use the PORT variable from .env, or default to 3000 if not set
const PORT = 3000;

// Initialize dotenv to load environment variables from the .env file
// dotenv.config();

// Create an instance of the Express app
const app = express();

// Enable CORS for all routes (you can customize it later if needed)
app.use(cors('*'));

// Json Parsor
app.use(express.json());

// Define a route that responds to GET requests
app.get('/', (req, res) => {
    res.send('Hello, Welcome to Website Builder!');
});

app.use('/ai', aiRoutes);
app.use('/ai', aiRoutes);

// Start the server on the specified port
app.listen(PORT, () => {
    // console.log(`Server is running on http://localhost:${PORT}`);
});
