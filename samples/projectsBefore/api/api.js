import express, { json } from 'express'
import fetch from 'node-fetch'

const server = express()

server.use(json())

const checkPhoneInTelephoneDirectory = async (phone) => {
    try {
        const directoryResponse = await fetch(
            `${process.env.TELEPHONE_DIRECTORY_URI}/v1/verify/${phone}`
        )
        if (![204, 404].includes(directoryResponse.status)) {
            throw new Error('could not verify on telephone directory')
        }

        return directoryResponse.status === 204
    } catch (e) {
        e.message = `check phone in telephone directory: ${e.message}`
        throw e
    }
}

const checkPhoneInBlacklist = async (phone) => {
    try {
        const blacklistResponse = await fetch(
            `${process.env.BLACKLIST_URI}/v1/verify/${phone}`
        )
        if (blacklistResponse.status !== 200) {
            throw new Error('could not verify on blacklist')
        }
        const { isBlacklisted } = await blacklistResponse.json()
        return isBlacklisted
    } catch (e) {
        e.message = `check phone in black list: ${e.message}`
        throw e
    }
}

const sendToProcess = async ({ text, phone, id }) => {
    try {
        const { status } = await fetch(
            `${process.env.PROCESS_URI}/v1/process`,
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
            throw new Error('fail to init process')
        }
    } catch (e) {
        e.message = `process: ${e.message}`
        throw e
    }
}

let _id = 1000
const getRequestId = () => {
    _id = _id + 1
    return _id
}

server.post('/v1/txt', async (req, res) => {
    if (!req.body.text || !req.body.phone) {
        return res.status(400).json({
            message: 'property "text" and "phone" are required'
        })
    }

    try {
        const isBlacklisted = await checkPhoneInBlacklist(req.body.phone)
        if (isBlacklisted) {
            return res.status(400).json({
                errors: ['phone number is on blacklist']
            })
        }

        const isValidPhone = await checkPhoneInTelephoneDirectory(
            req.body.phone
        )
        if (!isValidPhone) {
            return res.status(400).json({
                errors: ['phone number is not valid']
            })
        }

        const id = getRequestId()

        await sendToProcess({ id, phone: req.body.phone, text: req.body.text })

        return res.status(200).json({
            id
        })
    } catch (e) {
        console.error(e)
        return res.status(500).json({
            errors: ['internal failure']
        })
    }
})

const listener = server.listen(parseInt(process.env.PORT) || 3141, () => {
    console.info('listening on port', listener.address().port)
})
