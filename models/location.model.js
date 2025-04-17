import model from '../config/model.config.js'
import { config } from 'dotenv'
import fetch from 'node-fetch'

config()

async function getLocation (message) {
  if (!message) {
    return false
  }

  const prompt = `You are given a message. Extract the location and place names from the message and return them in a JSON format. The location names should be in the following format:

{
    "locations": [
        {
            "name": "location name"
        }
    ]
}
Do not include the departure location if it is given into the array. In the array put the complete address of the location with city name and country name
Follow the format strictly and do not add any extra information. Do not include markdown formatting or code blocks.

The message is:

  ${message}
  `
  try {
    const response = await model.invoke(prompt)
    const location = JSON.parse(
      response.content.replace(/```json|```/g, '').trim()
    )
    console.log('Extracted Location:', location)
    const completedLocations = completeLocations(location.locations)
    return completedLocations
  } catch (error) {
    console.error('Error extracting locations:', error)
    return false
  }
}

async function completeLocations (locations) {
  if (!Array.isArray(locations)) return []

  const enriched = await Promise.all(
    locations.map(async loc => {
      const query = encodeURIComponent(loc.name)
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

      try {
        const res = await fetch(url)
        const data = await res.json()

        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          return { ...loc, lat, long: lon }
        }
      } catch (error) {
        console.error(`Failed to geocode location "${loc.name}":`, error)
      }

      return null // If not successful, return null
    })
  )

  // Filter out null values (i.e., failed lookups)
  return enriched.filter(loc => loc !== null)
}

export default getLocation
;(async () => {
  const message = 'I am going to Paris and London next week.'
  const location = await getLocation(message)
  console.log('Extracted Location:', location)
})()
