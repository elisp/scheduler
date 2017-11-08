'use strict';

const logger = require('winston');
const config = require('./config');
const redis = require('redis');
const client = redis.createClient({ host: config.redis_host, port: config.redis_port });
const REDIS_KEY = 'jobs set'; // this key represets a sorted set by job time and its message

function addScheduledJob(time, message) {
  time = new Date(new Date(time).toUTCString());
  try {
    client.zadd(REDIS_KEY, time.getTime(), message);

    logger.debug(`[${process.pid}] addScheduledJob ${time}, ${message}`);
  }
  catch (err) {
    logger.error(err);
  }
}

function initListener() {
  // const near = Math.ceil(Math.random() * 5),
  //     far = Math.ceil(Math.random() * 10)
  // addScheduledJob(Date.now() + near * 1000, `this is message 1 to be displayed after ${near} seconds`);
  // addScheduledJob(Date.now() + far * 1000, `and this is message 2 to be displayed after ${far} seconds`);

  logger.debug(`[${process.pid}] Starting scheduler, interval ${config.scheduling_interval}`);

  setInterval(() => {
    let now = new Date(new Date().toUTCString()).getTime();
    client.multi()
      .zrangebyscore(REDIS_KEY, 0, now)
      .zremrangebyscore(REDIS_KEY, 0, now)
      .exec((error, data) => {
        if (error) {
          logger.error(error);
        } else {
          const jobList = data[0];
          if (jobList && jobList.length) {
            logger.debug(`[${process.pid}] message: ${jobList}`);
          } else {
            if (config.log_empty_queue) {
              logger.debug(`[${process.pid}] no jobs`);
            }
          }
        }
      });
  }, config.scheduling_interval * 1000);
}

module.exports = {
  addScheduledJob,
  initListener
};