'use strict';

const joi = require('joi');

const envVarsSchema = joi.object({
  NODE_ENV: joi.string()
    .allow(['development', 'production', 'test'])
    .default('production'),
  PORT: joi.number().integer().min(0).max(65535).default(3000),
  LOGGER_LEVEL: joi.string()
    .allow(['test', 'error', 'warn', 'info', 'verbose', 'debug', 'silly'])
    .when('NODE_ENV', {
      is: 'development',
      then: joi.default('silly')
    })
    .when('NODE_ENV', {
      is: 'production',
      then: joi.default('info')
    })
    .when('NODE_ENV', {
      is: 'test',
      then: joi.default('warn')
    })
})
  .unknown().required();

const envVars = joi.attempt(process.env, envVarsSchema);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  logger: {
    level: envVars.LOGGER_LEVEL
  }
};

module.exports = config;
