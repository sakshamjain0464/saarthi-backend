import model from '../config/model.config.js'

import { config } from 'dotenv'

config()

async function modifyIterinary (data) {
  const { iterinary, language, answer } = data

  const prompt = `
    You are a travel agent. You are give an pre-created iterinary, on the basis of the answer given by the chatbot modify the iterinary.

---

Only answer in the given language - ${language}

## Iterinary : ${iterinary}

## answer : ${answer}

### Instructions
1. **Modifying Content** : Only change the part of iterinary based on the answer, keep the rest of the content same and only change if it needs to be change on the basis of answer.
2. **Links** : While modifying do not remove any link add the new links below the existing links

2. **Formatting Requirements:**  
- Use Markdown syntax for headings, subheadings, and bullet/numbered lists.  
- All the important links must be given below the iterinary in [link_title](url) format in bold bullet points.
- Use **bold** text for key details like dates, locations, and travel methods.  
- Organize the itinerary clearly with a header for the overall trip overview and individual sections for each day or travel segment.
- Only give the iterinary
- If the iterinary is not a valid iterinary or not related to the answer just return "Sorry not a valid iterinary provided" and do not give any other information.

3. **Additional Considerations:**  
- Take travel time into account for each segment.  
- If the trip duration appears too short for the planned segments, include a suggestion or note about the insufficient time.  
- Do not modify or add any data; only work with what is provided.  
- Do not add any special comments about the provided data.
`
  try {
    const response = await model.invoke(prompt)
    console.log(response.content)
    return response.content
  } catch (error) {
    return false
  }
}

async function getSearchQuery (data, query) {
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
    viaCities
  } = data

  const prompt = `You are an intelligent search query generator. Based on the user's details and query, generate an optimized search query for web search.
### Provided Data Fields

- **StartDate:** ${startDate}  
- **EndDate:** ${endDate}  
- **From:** ${departureCity}  
- **Departure State:** ${departureState}
- **Destination State:** ${destinationState}
- **Via:** ${
    viaCities.length > 0 ? viaCities.map(item => item.city).join(', ') : 'Nil'
  }  
- **To:** ${destinationCity}  
- **NumberofPeople:** ${numberOfPeople}  
- **GroupType:** ${groupType}  
- **Interests:** ${interests}  
- **AdditionalInfo:** ${additionalInfo}  

## User Query:
"${query}"

## Instructions:
1. Reformulate the query to be **more specific and optimized for web search**.
2. Include relevant keywords based on **user interests**.
3. If location-specific results are needed, add relevant location details.
4. Ensure the query is **concise and effective**.
5. Do not include dates.

### Optimized Search Query:
Do not include any symbol in the output
`
  try {
    const response = await model.invoke(prompt)
    return response.content.replace(/[^\w\s]/gi, '')
  } catch (error) {
    return false
  }
}

export default modifyIterinary
