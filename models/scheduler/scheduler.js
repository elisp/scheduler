'use strict';

const bluebird = require('bluebird');
const moment = require('moment');
const redis = require('redis');
const logger = require('../../logger');
const config = require('./config');
const client = redis.createClient({ host: config.redis_host, port: config.redis_port });
const REDIS_QUEUE = 'jobs:set'; // this key represets a sorted set by job time and its message
const REDIST_COUNTER = "jobs:count";
bluebird.promisifyAll(redis);

async function reset() {
  await client.del(REDIS_QUEUE);
  await client.del(REDIST_COUNTER);
}

function addScheduledJob(time, message) {
  time = moment.utc(time);
  return new Promise((resolve, reject) => {
    try {
      client.incr(REDIST_COUNTER, (err, id) => {
        let data = {
          message: message,
          id: id,
          time
        };
        let redis_data = JSON.stringify(data);
        client.zadd(REDIS_QUEUE, time.valueOf(), redis_data);
        logger.verbose(`[${process.pid}] addScheduledJob ${time}, ${message}`);
        resolve(data);
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

function executePendingJobs(time) {
  return new Promise((resolve, reject) => {
    time = time || moment.utc().valueOf();
    client.zrangebyscore(REDIS_QUEUE, 0, time, (err, range) => {
      let multi = client.multi();
      let result = [];
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        const jobList = range;
        if (jobList && jobList.length) {
          jobList.forEach(jopbData => {
            let job = JSON.parse(jopbData);
            result.push(job);
            logger.verbose(`[${process.pid}] message: ${job.message}`);
          });
        } else {
          if (config.log_empty_queue) {
            logger.verbose(`[${process.pid}] no jobs`);
          }
        }
      }
      multi.zrangebyscore(REDIS_QUEUE, 0, time)
        .zremrangebyscore(REDIS_QUEUE, 0, time)
        .exec((error, data) => {
          if (error) {
            logger.error(error);
            reject(error);
          } else {
            resolve(result);
          }
        });
    });
  });
}

function initListener() {
  logger.debug(`[${process.pid}] Starting scheduler, interval ${config.scheduling_interval}`);

  setInterval(async () => {
    await executePendingJobs();
  }, config.scheduling_interval * 1000);
}

module.exports = {
  addScheduledJob,
  initListener,
  executePendingJobs,
  reset
};
