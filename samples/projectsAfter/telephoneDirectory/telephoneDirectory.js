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

const internationalPhoneFormat =
    /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/

server.get('/v1/verify/:phone', async (req, res) => {
    const childLogger = logger.child({
        action: 'http.post:/v1/verify/:phone',
        origination: req.header('X-Origin-Application'),
        'request.id': req.header('X-Request-ID')
    })

    try {
        // if includes 3, the phone "does not exist"
        if (
            req.params.phone.includes('3') ||
            !internationalPhoneFormat.test(req.params.phone)
        ) {
            childLogger.debug('end http.post:/v1/verify/:phone', {
                'http.status': 404
            })
            return res.status(404).json({
                errors: ['phone not found, thus do not exists']
            })
        } else {
            childLogger.debug('end http.post:/v1/verify/:phone', {
                'http.status': 204
            })
            return res.status(204).end()
        }
    } catch (e) {
        childLogger.error(e, 'fail http.post:/v1/verify/:phone', {
            'http.status': 404
        })
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
