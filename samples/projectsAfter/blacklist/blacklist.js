import express from 'express'
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

server.get('/v1/verify/:phone', async (req, res) => {
    const childLogger = logger.child({
        action: 'http.post:/v1/verify/:phone',
        origination: req.header('X-Origin-Application'),
        'request.id': req.header('X-Request-ID')
    })
    try {
        // just every odd number is blacklisted, :P
        childLogger.info('success http.post:/v1/verify/:phone')
        return res.status(200).json({
            isBlacklisted: Boolean(Number(req.params.phone) % 2)
        })
    } catch (e) {
        childLogger.error(e, 'fail http.post:/v1/verify/:phone')
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
