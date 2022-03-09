import express, { json } from 'express'
import { format } from '@fast-csv/format'
import fs from 'fs'

const server = express()

server.use(json())

server.post('/v1/write', async (req, res) => {
    try {
        res.status(204).end()
    } catch (e) {
        console.error(e)
        res.status(500).json({
            errors: ['internal failure']
        })
        return
    }

    const stream = format({ delimiter: ',' })
    const writeStream = fs.createWriteStream('/csv/database.csv', {
        flags: 'a'
    })
    stream.pipe(writeStream)

    stream.write([req.body.id, req.body.phone, req.body.text])
    stream.end()
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    console.info('listening on port', listener.address().port)
})
