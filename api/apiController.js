'use strict';

const joi = require('joi');
const logger = require('winston');
const scheduler = require('../models/scheduler');

const envVarsSchema = joi.object({
  time: joi.date().iso(),
  message: joi.string()
}).unknown()
  .required();

exports.echoAtTime = function (req, res) {
  try {
    const postVars = joi.attempt(req.body, envVarsSchema);
    const time = new Date(postVars.time);
    const message = postVars.message;

    scheduler.addScheduledJob(time, message);
    res.sendStatus(200);
  } catch (err) {
    logger.error(err);
    res.status(500).send('Error setting echoAtTime');
  }
};
