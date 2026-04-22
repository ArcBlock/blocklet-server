/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
/* eslint-disable consistent-return */
const { CustomError } = require('@blocklet/error');
const { DataStore } = require('@abtnode/db/lib/base');

class NedbStore {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new DataStore({
      filename: this.dbPath,
      autoload: true,
    });
  }

  async isCancelled(id) {
    const job = await this.db.findOne({ id });
    return !!job && !!job.cancelled;
  }

  getJob(id) {
    return this.db.findOne({ id });
  }

  getJobs() {
    return this.db
      .cursor({ delay: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();
  }

  getScheduledJobs() {
    return this.db
      .cursor({ delay: { $exists: true }, willRunAt: { $lte: Date.now() } })
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateJob(id, updates) {
    const job = await this.db.findOne({ id });
    if (!job) {
      throw new CustomError('JOB_NOT_FOUND', `Job ${id} does not exist`);
    }

    const update = { ...updates, updatedAt: Date.now() };
    await this.db.update({ id }, { $set: update });
    return Object.assign(job, update);
  }

  async addJob(id, job, attrs = {}) {
    const exist = await this.db.findOne({ id });
    if (exist) {
      throw new CustomError('JOB_DUPLICATE', `Job ${id} already exist`);
    }
    return this.db.insert({
      id,
      job,
      retryCount: 1,
      cancelled: false,
      ...attrs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async deleteJob(id) {
    const data = await this.db.remove({ id });
    return data;
  }

  loadDatabase(cb) {
    this.db.loadDatabase(cb);
  }
}

module.exports = NedbStore;
