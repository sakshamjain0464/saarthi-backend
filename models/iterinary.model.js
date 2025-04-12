import model from '../config/model.config.js'

import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search'

import { config } from 'dotenv'

config()

const tool = new DuckDuckGoSearch({ maxResults: 20 })

async function generateIterinary (data) {
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

  let search_results

  try {
    const query = await getSearchQuery(
      data,
      'Find all the travel information provided for the user data to search for hotels, events and places to visit with approximate budget'
    )
    console.log(query)
    const response = await tool.invoke(query)
    console.log(response)
    search_results = response
  } catch (error) {
    console.log(error)
    return false
  }

  const prompt = `
    You are a travel agent. Based solely on the provided data and search results, generate a travel itinerary in **Markdown** format with clear headings, subheadings, and proper text formatting. **Do not assume any information beyond what is provided.** Use the language specified in **${language}**. Keep the language simple, local, and friendly.

---

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

---

## Search Results  
${search_results}

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
- **Direct Route:** If there are no via cities (i.e., Via is "Nil"), plan the trip from the departure to the destination.  
- **Via Cities:** If via cities are given plan the trip covering all the cities.  
- **Search Results:** Refer to the given search results to generate itinerary, the search results are real-time data available on internet, give the itinerary based upon our knowledge and search results.  
- **Detailed Plan:** Include each and every detail of every day and place.  
- **Complete Trip:** Give complete trip itinerary including all the places to visit, eat and everything.  
- **Details:** Include all details about the place.

4. **Formatting Requirements:**  
- Use Markdown syntax for headings, subheadings, and bullet/numbered lists.  
- All the important links must be given below the itinerary in [link_title](url) format in **bold** bullet points.  
- Use **bold** text for key details like dates, locations, and travel methods.  
- Organize the itinerary clearly with a header for the overall trip overview and individual sections for each day or travel segment.

5. **Additional Considerations:**  
- Take the time from departure to destination into account.
- Take travel time into account for each segment.  
- If the trip duration appears too short for the planned segments, include a suggestion or note about the insufficient time.  
- Do not modify or add any data; only work with what is provided.  
- Do not add any special comments about the provided data.

6. **Professional Format Enhancements:**  
- Ensure the itinerary appears professional and polished with clean layout, consistent formatting, and clarity.  
- Use bullet points, bold headings, and structured sub-sections to improve readability.

7. **Budget Details:**  
- Include an **approximate budget** for each major activity (travel, stay, food, entry tickets, etc.) under the respective day or segment.  
- At the **end of the itinerary**, add a summary section titled **"Total Estimated Budget"** with a total cost for the entire trip.:  

8. **Mandatory Formatting Compliance:**  
- Follow the **itinerary output format strictly** as defined above.  
- **Do not generate anything outside the defined format.**
---

---
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

export default generateIterinary
