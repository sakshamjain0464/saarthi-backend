import express from 'express'
import { parse } from 'marked'
import morgan from 'morgan'
import cors from 'cors'
import wkhtmltopdf from 'wkhtmltopdf'
import fs from 'fs'
import path from 'path'
import generateIterinary from './models/iterinary.model.js'
import answerQuestion from './models/chat.model.js'
import modifyIterinary from './models/modifyIterinary.model.js'
import getLocation from './models/location.model.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())

app.use(cors())
app.use(morgan('dev'))

const pdfDir = path.join(process.cwd(), 'pdfs')
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir)
}

app.post('/generate-itinerary', async (req, res) => {
  try {
    const response = await generateIterinary(req.body)
    res.json({ data: response })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to generate response.' })
  }
})

app.post('/ask-question', async (req, res) => {
  try {
    const response = await answerQuestion(req.body)
    // console.log(response);
    res.json({ data: response })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to generate response.' })
  }
})

app.post('/modify-iterinary', async (req, res) => {
  try {
    const response = await modifyIterinary(req.body)
    res.json({ data: response })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to generate response.' })
  }
})

app.post('/download-itinerary', (req, res) => {
  let { itineraryMarkdown, language } = req.body
  if (!itineraryMarkdown) {
    return res.status(400).json({ error: 'Itinerary markdown is required.' })
  }

  // Convert Markdown to HTML using marked
  itineraryMarkdown += `\n \n \n <div style="text-align:right; font-style: italic;">Saarthi - By Naitik Tiwari and Saksham Jain</div>`
  // console.log(itineraryMarkdown)
  let htmlContent = parse(itineraryMarkdown)

  htmlContent = `<!DOCTYPE html>
<html lang="${language == 'English' ? 'en' : 'hi'}">
<head>
<meta charset="utf-8">
<title>Itinerary</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" rel="stylesheet">
<style>
  body {
    font-family: 'Noto Sans Devanagari', sans-serif;
  }
</style>
</head>
<body>
<!-- Insert your marked-generated HTML here -->
${htmlContent}
</body>
</html>
`

  // Generate a unique filename for the PDF
  const fileName = `${new Date().toISOString}.pdf`
  const filePath = path.join(pdfDir, fileName)

  // Convert HTML to PDF using wkhtmltopdf
  wkhtmltopdf(
    htmlContent,
    {
      output: filePath,
      executablePath: 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe'
    },
    err => {
      if (err) {
        console.error('Error generating PDF:', err)
        return res.status(500).json({ error: 'Error generating PDF.' })
      }

      // Schedule deletion of the PDF after 30 minutes (30 * 60 * 1000 ms)
      setTimeout(() => {
        fs.unlink(filePath, unlinkErr => {
          if (unlinkErr) {
            console.error('Error deleting file:', unlinkErr)
          } else {
            console.log(`Deleted file: ${fileName}`)
          }
        })
      }, 30 * 60 * 1000)

      // Send the generated PDF file for download
      res.download(filePath, fileName, downloadErr => {
        if (downloadErr) {
          console.error('Error sending file:', downloadErr)
          return res.status(500).json({ error: 'Error sending file.' })
        }
      })
    }
  )
})

app.post('/locations', async (req, res) => {
  console.log(req.body)
  const message = req.body.message
  if (!message) {
    return res.status(400).json({ error: 'message is required.' })
  }
  try {
    const response = await getLocation(message)
    if (!response) {
      return res.status(500).json({ error: 'Failed to extract locations.' })
    }
    res.json({ data: response })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to extract locations.' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
