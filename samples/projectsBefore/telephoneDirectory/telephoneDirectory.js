import express from 'express'

const server = express()

const internationalPhoneFormat =
    /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/

server.get('/v1/verify/:phone', async (req, res) => {
    try {
        // if includes 3 does not exist
        if (
            req.params.phone.includes('3') ||
            !internationalPhoneFormat.test(req.params.phone)
        ) {
            return res.status(404).json({
                errors: ['phone not found, thus do not exists']
            })
        } else {
            return res.status(204).end()
        }
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
