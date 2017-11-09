'use strict';

const moment = require('moment');
const { expect } = require('chai');
const scheduler = require('./scheduler');

describe('Scheduler', () => {
  let id;
  let userToInsert;

  beforeEach(async () => {
    scheduler.reset();
  });

  afterEach(async () => {
  });

  describe('.addScheduledJob', () => {
    it('should add new scheduled job', (done) => {
      let time = moment.utc();
      let later = time.add(5);
      scheduler.addScheduledJob(time.valueOf(), "message")
        .then(() => {
          scheduler.executePendingJobs(later.valueOf())
            .then((data) => {
              expect(data.length).to.eql(1);
              done();
            });
        });
    });

    it('should allow adding the job details twice', (done) => {
      let time = moment.utc();
      let later = time.add(5);
      scheduler.addScheduledJob(time.valueOf(), "message")
        .then(() => {
          scheduler.addScheduledJob(time.valueOf(), "message")
            .then(() => {
              scheduler.executePendingJobs(later.valueOf())
                .then((data) => {
                  expect(data.length).to.eql(2);
                  done();
                });
            });
        });
    });

  });

  // describe('.handle jobs', () => {
  //   it('should insert a new user', async () => {
  //   });
  // });
});
