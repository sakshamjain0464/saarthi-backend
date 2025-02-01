require('dotenv').config(); // Load environment variables
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = 'AIzaSyDDXVe_4gA1LDX8VbdGGud0PZ8sZYzC2iE';

// Route to generate itinerary or handle general questions
app.post('/generate-itinerary', async (req, res) => {
    const { destination, days, interests, followUpQuestion, itinerary } = req.body;

    try {
        let prompt;
        if (followUpQuestion) {
            prompt = `You are a friendly travel guide. The user has already planned the following itinerary: ${itinerary}. 
            Answer this question in the context of the itinerary: ${followUpQuestion}`;
        } else {
            prompt = `Create a detailed ${days}-day travel itinerary for ${destination}. 
            Include recommendations based on these interests: ${interests.join(', ')}. 
            Provide specific locations, estimated time at each location, 
            and brief descriptions of activities.`;
        }

        console.log('Prompt sent to Gemini API:', prompt);

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${'AIzaSyDsOa8G-eqFBieQTag1u-7eknCMu_ouvVE'}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Gemini API Response:', response.data);

        const reply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply });
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate response.' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});