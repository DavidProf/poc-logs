import express, { json } from 'express'
import fetch from 'node-fetch'

const server = express()

server.use(json())

const normalizeText = (text) =>
    text.replace(/[]/g, '').replace(/\s+/g, ' ').toLowerCase()

const capitalizeFirstLetter = (text) =>
    `${text[0].toUpperCase()}${text.slice(1)}`

const capitalize = (text) => text.toUpperCase()

const sendToCSVWriter = async ({ id, phone, text }) => {
    try {
        const { status } = await fetch(
            `${process.env.CSV_WRITER_URI}/v1/write`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    phone,
                    text
                })
            }
        )
        if (status !== 204) {
            throw new Error('could not send to csv writer')
        }
    } catch (e) {
        e.message = `send to csv writer: ${e.message}`
        throw e
    }
}

let bool = false
server.post('/v1/process', async (req, res) => {
    try {
        res.status(204).end()
    } catch (e) {
        console.error(e)
        res.status(500).json({
            errors: ['internal failure']
        })
        return
    }
    const payload = req.body
    req.body.id
    req.body.phone
    payload.text = normalizeText(req.body.text)
    payload.text = bool
        ? capitalizeFirstLetter(payload.text)
        : capitalize(payload.text)
    bool = !bool

    await sendToCSVWriter(payload)
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    console.info('listening on port', listener.address().port)
})
