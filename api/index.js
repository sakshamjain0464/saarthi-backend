require('dotenv').config(); // Load environment variables
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const wkhtmltopdf = require('wkhtmltopdf');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = 'AIzaSyCUzpgJqzBXjLOmqO9l340YlyH5AqLyJWk';

const pdfDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

async function getResponse(text) {
    try {
        console.log('Prompt sent to Gemini API:', text);

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text }] }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Gemini API Response:', response.data);

        const reply = response.data.candidates[0].content.parts[0].text;
        return reply
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        return false
    }
}

// Route to generate itinerary or handle general questions
app.post('/generate-itinerary', async (req, res) => {
    const {
        departureState,
        departureCity,
        destinationState,
        destinationCity,
        startDate,
        endDate,
        numberOfPeople,
        groupType,
        interests,
        additionalInfo,
        language,
        viaCities,
    } = req.body;


    console.log('Request Body:', req.body);


    const prompt = `
        You are a travel agent. Based solely on the provided data, generate a travel itinerary in **Markdown** format with clear headings, subheadings, and proper text formatting. **Do not assume any information beyond what is provided.** Use the language specified in **${language}**. Keep the language simple, local, and friendly.

---

### Provided Data Fields

- **StartDate:** ${startDate}  
- **EndDate:** ${endDate}  
- **From:** ${departureCity}  
- **Via:** ${viaCities.length > 0 ? viaCities.map((item) => item.city).join(", ") : "Nil"}  
- **To:** ${destinationCity}  
- **NumberofPeople:** ${numberOfPeople}  
- **GroupType:** ${groupType}  
- **Interests:** ${interests}  
- **AdditionalInfo:** ${additionalInfo}  

---

### Instructions

1. **Itinerary Overview:**  
   - List the trip dates, departure, destination, group details, interests, and additional information.

2. **Itinerary Details:**  
   - For each travel segment or day, include:  
     - **Location Name:** State the name of the location or transit point.  
     - **Location Description:** Provide a brief description of the location using only the provided data.  
     - **Estimated Time:** Specify the estimated duration at or transit through the location.  
     - **Best Travel Method:** Recommend the best travel method based on the data.

3. **Planning Consideration:**  
   - **Direct Route:** If there are no via cities (i.e., Via is "Nil"), cplan the trip from the departure to the destination.  
   - **Via Cities**:If via cities are given plan the trip covering all the cities.
   -""Complete Trip**: Give complete trip itirenary including all the places to visit, eat and everything.
   -**Details**: Include all details about the place

4. **Formatting Requirements:**  
   - Use Markdown syntax for headings, subheadings, and bullet/numbered lists.  
   - Use **bold** text for key details like dates, locations, and travel methods.  
   - Organize the itinerary clearly with a header for the overall trip overview and individual sections for each day or travel segment.

5. **Additional Considerations:**  
   - Take travel time into account for each segment.  
   - If the trip duration appears too short for the planned segments, include a suggestion or note about the insufficient time.  
   - Do not modify or add any data; only work with what is provided.  
   - Do not add any special comments about the provided data.

---

### Example Output Format

# Travel Itinerary

## Trip Overview
- **Start Date:** [StartDate]  
- **End Date:** [EndDate]  
- **Departure:** [From]  
- **Destination:** [To]  
- **Number of People:** [NumberofPeople]  
- **Group Type:** [GroupType]  
- **Interests:** [Interests]  
- **Additional Info:** [AdditionalInfo]  

---

## Day 1: [Location Name]  
**Description:**  
[Description of the location based solely on the provided data.]  

**Estimated Time:**  
[Estimated time at the location or transit duration.]  

**Travel Method:**  
[Best travel method based on the data.]  

---

*Repeat for subsequent days or segments as applicable.*
  `;

    try {
        const response = await getResponse(prompt);
        console.log(response);
        res.json({ data: response });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate response.' });
    }
});


// Route to handle general questions
app.post('/ask-question', async (req, res) => {
    const { question, itinerary, language } = req.body;


    prompt = `You are a travel assistant. Below is a travel itinerary in Markdown format that was generated by you. Your task is to answer the follow-up question using.

    **Give the answer strictly in ${language} language irrespective of the language of the asked question. Use normal language do not use complex words and keep the language local**

    **Instructions:**
    1. **Review the Itinerary:**  
       Carefully read the itinerary provided below. Take note of all the dates, locations, travel methods, and any additional details included.

    2. **Answer the Follow-Up Question:**  
       Based solely on the details in the itinerary, provide a complete answer to the follow-up question. Format your answer in Markdown with clear headings and bullet points if needed.

    3. **Add extra details if the user asks for them:**
        If the user asks for more information, you can provide additional details based on the context of the itinerary. You can add places to visit, activities to do, or any other relevant information. But do not modify the Start Date, End Date, From, To, Number of People, Group Type, Interests, Additional Info, or the Itinerary.

    4. **Itenerary:**
            The itenerary is generated by you only so do not tell the user the itenerary is wrong or right or does not contain enough information. You can even add more information to the itenerary if you want.

    ---

    ### Travel Itinerary:
    ${itinerary}

    ---

    ### Follow-Up Question:
    ${question}

    ---

    Please provide your answer in Markdown format.
            `

    try {
        const response = await getResponse(prompt);
        console.log(response);
        res.json({ data: response });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate response.' });
    }
})
app.post('/download-itinerary', (req, res) => {
    let { itineraryMarkdown } = req.body;
    if (!itineraryMarkdown) {
        return res.status(400).json({ error: 'Itinerary markdown is required.' });
    }

    // Convert Markdown to HTML using marked
    itineraryMarkdown += `\n \n \n <div style="text-align:right; font-style: italic;">Saarthi - By Naitik Tiwari and Saksham Jain</div>`
    console.log(itineraryMarkdown)
    const htmlContent = marked.parse(itineraryMarkdown);

    // Generate a unique filename for the PDF
    const fileName = `${new Date().toISOString}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // Convert HTML to PDF using wkhtmltopdf
    wkhtmltopdf(htmlContent, { output: filePath }, (err) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).json({ error: 'Error generating PDF.' });
        }

        // Schedule deletion of the PDF after 30 minutes (30 * 60 * 1000 ms)
        setTimeout(() => {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting file:', unlinkErr);
                } else {
                    console.log(`Deleted file: ${fileName}`);
                }
            });
        }, 30 * 60 * 1000);

        // Send the generated PDF file for download
        res.download(filePath, fileName, (downloadErr) => {
            if (downloadErr) {
                console.error('Error sending file:', downloadErr);
                return res.status(500).json({ error: 'Error sending file.' });
            }
        });
    });
});




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
