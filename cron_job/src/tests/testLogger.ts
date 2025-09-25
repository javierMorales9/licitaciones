import { pino } from "pino";

export const testLogger = pino({ level: "fatal" });

/*
export const testLogger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l o",
      ignore: "pid,hostname",
    },
  },
});
*/
