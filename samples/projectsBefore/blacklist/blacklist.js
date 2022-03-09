import express from 'express'

const server = express()

server.get('/v1/verify/:phone', async (req, res) => {
    try {
        // just every odd number is blacklisted, :P
        return res.status(200).json({
            isBlacklisted: Boolean(Number(req.params.phone) % 2)
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
