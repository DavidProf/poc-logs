// environment variables from https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#exports_config
import "dotenv/config";
import "newrelic";
import newrelicFormatter from "@newrelic/winston-enricher";
import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(newrelicFormatter()),
    transports: [new winston.transports.Console()],
});

const child = logger.child({ child: 1 });

// logger.trace("trace message"); // by default no trace in the lib
logger.debug("debug message");
logger.info("info message");
logger.warn("warn message");
logger.error("error message");
// logger.fatal("fatal message"); // by default no fatal in the lib

child.info("info message from logger child");

logger.info("info message with object", { data: 523 });

logger.error(new Error("generic error"));

logger.info({ info: "log without property message, but with object" });

logger.level = "error"; // by default no fatal in the lib

// logger.trace("will not be logged"); // by default no trace in the lib
logger.debug("will not be logged");
logger.info("will not be logged");
logger.warn("will not be logged");
logger.error("will be logged");
// logger.fatal("will be logged"); // by default no fatal in the lib

child.info("will be logged");
const child2 = logger.child({ child: 2 });
child2.info("will not be logged");

logger.level = "info";

logger.info(
    "only same or greater level can be logged as configured, but is not applied to old childs"
);
