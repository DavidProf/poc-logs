import express, { json } from 'express'
import * as csv from '@fast-csv/format'
import fs from 'fs'
import pino from 'pino'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { name: appName } = require('./package.json')

const logger = pino({
    level: 'trace',
    base: {
        application: appName
    }
})

const server = express()

server.use(json())

const addRow = ({ id, phone, text, requestId }) => {
    const childLogger = logger.child({
        action: 'function.addRow',
        'request.id': requestId,
        'message.id': id
    })

    childLogger.debug('start addRow')
    try {
        const stream = csv.format({
            delimiter: ',',
            includeEndRowDelimiter: true
        })

        const writeStream = fs.createWriteStream('/csv/database.csv', {
            flags: 'a'
        })
        stream.pipe(writeStream)

        stream.write([id, phone, text])
        stream.end()

        childLogger.info('success addRow')
    } catch (e) {
        childLogger.fatal(e, 'fail addRow')
    }
}

server.post('/v1/write', async (req, res) => {
    const requestId = req.header('X-Request-ID')
    const childLogger = logger.child({
        action: 'http.post:/v1/write',
        origination: req.header('X-Origin-Application'),
        'request.id': requestId,
        'message.id': req.body.id
    })

    res.status(204).end()
    childLogger.debug('return success response http.post:/v1/process', {
        'http.status': 204
    })

    addRow({
        id: req.body.id,
        phone: req.body.phone,
        text: req.body.text,
        requestId
    })
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    const port = listener.address().port
    logger.info(`listening on port ${port}`, {
        action: 'http.server.start'
    })
})
