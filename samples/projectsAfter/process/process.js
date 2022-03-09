import express, { json } from 'express'
import fetch from 'node-fetch'
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

const normalizeText = (text) =>
    text.replace(/[]/g, '').replace(/\s+/g, ' ').toLowerCase()

const capitalizeFirstLetter = (text) =>
    `${text[0].toUpperCase()}${text.slice(1)}`

const capitalize = (text) => text.toUpperCase()

const sendToCSVWriter = async ({ payload: { id, phone, text }, requestId }) => {
    const childLogger = logger.child({
        action: 'function.sendToCSVWriter',
        'request.id': requestId,
        'message.id': id
    })

    childLogger.debug('start sendToCSVWriter')
    try {
        const { status } = await fetch(
            `${process.env.CSV_WRITER_URI}/v1/write`,
            {
                method: 'POST',
                headers: {
                    'X-Origin-Application': appName,
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
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
        childLogger.info('success sendToCSVWriter')
    } catch (e) {
        logger.error(e, 'fail sendToCSVWriter')
        throw e
    }
}

let bool = false
const transformPayload = (payload) => {
    payload.text = normalizeText(payload.text)
    payload.text = bool
        ? capitalizeFirstLetter(payload.text)
        : capitalize(payload.text)
    bool = !bool
    return payload
}

const processIt = ({ payload, requestId }) => {
    const childLogger = logger.child({
        action: 'function.processIt',
        'request.id': requestId,
        'message.id': payload.id
    })
    try {
        childLogger.debug('trying to execute transformPayload')
        payload = transformPayload(payload)
    } catch (e) {
        childLogger.warn(e, 'fail function.processIt')
    }

    sendToCSVWriter({ payload, requestId })
}

server.post('/v1/process', (req, res) => {
    const requestId = req.header('X-Request-ID')
    const childLogger = logger.child({
        action: 'http.post:/v1/process',
        origination: req.header('X-Origin-Application'),
        'request.id': requestId,
        'message.id': req.body.id
    })

    res.status(204).end()
    childLogger.debug('return success response http.post:/v1/process', {
        'http.status': 204
    })

    processIt({ payload: req.body, requestId })
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    const port = listener.address().port
    logger.info(`listening on port ${port}`, {
        action: 'http.server.start'
    })
})
