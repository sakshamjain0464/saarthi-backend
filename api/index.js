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
const GEMINI_API_KEY = 'AIzaSyCUzpgJqzBXjLOmqO9l340YlyH5AqLyJWk';

// Route to generate itinerary or handle general questions
app.post('/generate-itinerary', async (req, res) => {
    const { destination, days, interests, groupType, additionalInfo, followUpQuestion, itinerary } = req.body;

    // Validate required fields for initial itinerary generation
    if (!followUpQuestion && (!destination || !days || !interests)) {
        return res.status(400).json({ error: 'Missing required fields: destination, days, or interests.' });
    }

    try {
        let prompt;

        if (followUpQuestion) {
            // Handle follow-up questions
            prompt = `You are a friendly travel guide. The user has already planned the following itinerary: ${itinerary}. 
            Answer this question in the context of the itinerary: ${followUpQuestion}. Format your response in Markdown.`;
        } else {
            // Generate a new itinerary
            prompt = `Create a detailed ${days}-day travel itinerary for ${destination}. 
            Include recommendations based on these interests: ${interests.join(', ')}. 
            Group Type: ${groupType}. Additional Information: ${additionalInfo}.
            Provide specific locations, estimated time at each location, 
            and brief descriptions of activities. Format your response in Markdown.`;
        }

        console.log('Prompt sent to Gemini API:', prompt);

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
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

        let reply = response.data.candidates[0].content.parts[0].text;

        // Post-process the response to ensure proper Markdown formatting
        reply = formatAsMarkdown(reply);

        res.json({ reply });
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate response.' });
    }
});

// Helper function to format the response as Markdown
function formatAsMarkdown(text) {
    // Add Markdown headers, lists, and bold formatting
    text = text.replace(/Day (\d+)/g, '# Day $1'); // Convert "Day X" to Markdown headers
    text = text.replace(/\*\*(.*?)\*\*/g, '**$1**'); // Ensure bold text is properly formatted
    text = text.replace(/^- /gm, '- '); // Ensure list items start with a hyphen

    return text.trim(); // Remove leading/trailing whitespace
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
