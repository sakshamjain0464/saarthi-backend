import model from '../config/model.config.js'
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search'

import { config } from 'dotenv'

config()

const tool = new DuckDuckGoSearch({ maxResults: 20 })

async function answerQuestion (data) {
  const { question, iterinary, language, chatHistory } = data

  let search_results

  try {
    const query = await getSearchQuery(data, question)
    if (query != 'No Search') {
      const response = await tool.invoke(query)
      console.log(response)
      search_results = response
    } else search_results = ''
  } catch (error) {
    console.log(error)
    return false
  }

  const jsonChat = JSON.stringify(chatHistory)

  const prompt = `You are a travel assistant. Below is a travel itinerary in Markdown format that was generated by you. Your task is to answer the follow-up question using. Max character limit of iterinary is 10000 characters.

    **Give the answer strictly in ${language} language irrespective of the language of the asked question. Use normal language do not use complex words and keep the language local**

    **You are also given the web search results based on the user's question use the search results as the data source for the answer, you can use your own data also**

    **Instructions:**
    1. **Review the Itinerary:**  
       Carefully read the itinerary provided below. Take note of all the dates, locations, travel methods, and any additional details included.

    2. **Answer the Follow-Up Question:**  
       Based solely on the details in the itinerary, provide a complete answer to the follow-up question. Format your answer in Markdown with clear headings and bullet points if needed.

    3. **Add extra details if the user asks for them:**
        If the user asks for more information, you can provide additional details based on the context of the itinerary. You can add places to visit, activities to do, or any other relevant information. But do not modify the Start Date, End Date, From, To, Number of People, Group Type, Interests, Additional Info, or the Itinerary.

    4. **Itenerary:**
            The itenerary is generated by you only so do not tell the user the itenerary is wrong or right or does not contain enough information. You can even suggest changes to the iterinary but do not modify it. 

    5. **Modification** : If the user asks for any information related to the iterinary or places(travel, places, hotels, stays, trains, buses etc), asks for any modification change(Add or remove places etc) or iterinary should be modified make the {isModifyIterinary} variable as true in the answer format and do not make change into the original iterinary or give complete iterinary only give the suggested changes.
    6. **Chat History:**
            You can use the chat history to get the context of the question asked by the user, you can also answer the question based on chat history also.

    ---

    ### Travel Itinerary:
    ${iterinary}

    ---

    ### Follow-Up Question:
    ${question}

    ---
    ### Search Result:
    ${search_results}

    ---

    ### Chat History:
    ${jsonChat}

    ---
    ## Answer Format in json:
    {
      answer : <Answer in Markdown>,
      isModifyIterinary : <true or false>
    }
    Please provide your answer in Markdown format. All the important links must be given below the iterinary in [link_title](url) format in bold bullet points.
    Do not add \n\n{isModifyIterinary: true} or \n\n{isModifyIterinary: false} in the answer variable. Just give the answer in json format and make the isModifyIterinary variable true or false  and do not add any other information

            `

  console.log(prompt)

  try {
    const response = await model.invoke(prompt)
    console.log(response.content)
    const answer = response.content.replace(/```json|```/g, '').trim()
    return JSON.parse(answer)
  } catch (error) {
    console.log(error)
    return false
  }
}

async function getSearchQuery (data, query) {
  const { question, iterinary, language, chatHistory } = data

  const prompt = `You are an intelligent search query generator. The user has given an iterinary and their chat_history, the user will ask question on the basis of iterinary, use chat_history as context. Generate an optimized search query.
### Provided Data Fields

-**Iterinary** - ${iterinary}
-**chat_history** - ${chatHistory}

## User Query:
"${query}"

**If the query is not related to iterinary or chat_history just return "No Search"**

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

export default answerQuestion
