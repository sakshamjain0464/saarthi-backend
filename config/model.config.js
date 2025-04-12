import dotenv from 'dotenv'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

dotenv.config()

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  temperature: 0,
  maxRetries: 2,
  apiKey: process.env.GEM_API
})

export default model
