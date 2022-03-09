import pino from 'pino'

// pino levels
// trace: 10,
// debug: 20,
// info: 30,
// warn: 40,
// error: 50,
// fatal: 60

const logger = pino({
    level: 'trace'
})

const child = logger.child({ child: 1 })

logger.trace('trace message')
logger.debug('debug message')
logger.info('info message')
logger.warn('warn message')
logger.error('error message')
logger.fatal('fatal message')

child.info('info message from logger child')

logger.info('info message with object', { data: 523 })

logger.error(new Error('generic error'))

logger.info({ info: 'log without property message, but with object' })

logger.level = 'fatal'

logger.trace('will not be logged')
logger.debug('will not be logged')
logger.info('will not be logged')
logger.warn('will not be logged')
logger.error('will not be logged')
logger.fatal('will be logged')

child.info('will be logged')
const child2 = logger.child({ child: 2 })
child2.info('will not be logged')

logger.level = 'info'

logger.info(
    'only same or greater level can be logged as configured, but is not applied to old childs'
)
