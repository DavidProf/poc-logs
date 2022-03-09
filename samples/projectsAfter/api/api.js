import express, { json } from 'express'
import fetch from 'node-fetch'
import pino from 'pino'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { name: appName } = require('./package.json')

const logger = pino({
    level: 'trace',
    base: {
        application: appName,
        labels: ['sms', 'telegram']
    }
})

const server = express()

server.use(json())

const checkPhoneInTelephoneDirectory = async (phone) => {
    const childLogger = logger.child({
        action: 'function:checkPhoneInTelephoneDirectory'
    })

    childLogger.debug('start checkPhoneInTelephoneDirectory')
    try {
        const directoryResponse = await fetch(
            `${process.env.TELEPHONE_DIRECTORY_URI}/v1/verify/${phone}`,
            {
                headers: {
                    'X-Origin-Application': appName
                }
            }
        )
        if (![204, 404].includes(directoryResponse.status)) {
            throw new Error('could not verify on telephone directory')
        }

        childLogger.debug('end checkPhoneInTelephoneDirectory')
        return directoryResponse.status === 204
    } catch (e) {
        childLogger.error(e, 'fail checkPhoneInTelephoneDirectory')
        throw e
    }
}

const checkPhoneInBlacklist = async (phone) => {
    const childLogger = logger.child({
        action: 'function:checkPhoneInBlacklist'
    })

    childLogger.debug('start checkPhoneInBlacklist')
    try {
        const blacklistResponse = await fetch(
            `${process.env.BLACKLIST_URI}/v1/verify/${phone}`,
            {
                headers: {
                    'X-Origin-Application': appName
                }
            }
        )
        if (blacklistResponse.status !== 200) {
            throw new Error('could not verify on blacklist')
        }
        const { isBlacklisted } = await blacklistResponse.json()
        childLogger.debug('end checkPhoneInBlacklist')
        return isBlacklisted
    } catch (e) {
        childLogger.error(e, 'fail checkPhoneInBlacklist')
        throw e
    }
}

const sendToProcess = async ({ text, phone, id, requestId }) => {
    const childLogger = logger.child({
        action: 'function:sendToProcess',
        'request.id': requestId,
        'message.id': id
    })

    childLogger.debug('start sendToProcess')
    try {
        const { status } = await fetch(
            `${process.env.PROCESS_URI}/v1/process`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    'X-Origin-Application': appName
                },
                body: JSON.stringify({
                    id,
                    phone,
                    text
                })
            }
        )
        if (status !== 204) {
            throw new Error('fail to init process')
        }

        childLogger.debug('end sendToProcess')
    } catch (e) {
        childLogger.error(e, 'fail sendToProcess')
        throw e
    }
}

let _id = 1000
const generateId = () => {
    _id = _id + 1
    return _id
}

server.post('/v1/txt', async (req, res) => {
    const id = generateId()

    const requestId = req.header('X-Request-ID') || `${id}`
    res.set('X-Request-ID', requestId)

    const childLogger = logger.child({
        action: 'http.post:/v1/txt',
        origination: req.headers['X-Origin-Application'],
        'request.id': requestId,
        'message.id': id
    })
    childLogger.debug('start http.post:/v1/txt')

    if (!req.body.text || !req.body.phone) {
        childLogger.debug('end http.post:/v1/txt', { 'http.status': 400 })
        return res.status(400).json({
            message: 'property "text" and "phone" are required'
        })
    }

    try {
        const isBlacklisted = await checkPhoneInBlacklist(req.body.phone)
        if (isBlacklisted) {
            childLogger.debug('end http.post:/v1/txt', { 'http.status': 400 })
            return res.status(400).json({
                errors: ['phone number is on blacklist']
            })
        }

        const isValidPhone = await checkPhoneInTelephoneDirectory(
            req.body.phone
        )
        if (!isValidPhone) {
            childLogger.debug('end http.post:/v1/txt', { 'http.status': 400 })
            return res.status(400).json({
                errors: ['phone number is not valid']
            })
        }

        await sendToProcess({
            id,
            phone: req.body.phone,
            text: req.body.text,
            requestId
        })

        childLogger.info('success http.post:/v1/txt', { 'http.status': 200 })
        return res.status(200).json({
            id
        })
    } catch (e) {
        logger.error(e, 'fail http.post:/v1/txt')
        return res.status(500).json({
            errors: ['internal failure']
        })
    }
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    const port = listener.address().port
    logger.info(`listening on port ${port}`, {
        action: 'http.server.start'
    })
})
