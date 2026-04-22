const { CustomError } = require('@blocklet/error');

class SequelizeStore {
  timeoutMs = 60_000;

  constructor(db, queue) {
    this.db = db;
    this.queue = queue;
    this.processId = `${process.pid}`;
  }

  async isCancelled(id) {
    const job = await this.db.findOne({ queue: this.queue, id });
    return !!job && !!job.cancelled;
  }

  async getJob(id) {
    const timeoutThreshold = Date.now() - this.timeoutMs;
    const now = Date.now();

    // 先原子性标记job
    const [numUpdated] = await this.db.update(
      {
        queue: this.queue,
        id,
        $or: [
          { processingBy: { $exists: false } },
          { processingBy: null },
          { processingBy: this.processId },
          { processingAt: { $lt: timeoutThreshold } },
        ],
      },
      { $set: { processingBy: this.processId, processingAt: now } }
    );

    if (numUpdated > 0) {
      // 返回被成功标记的job
      return this.db.findOne({
        queue: this.queue,
        id,
        processingBy: this.processId,
        processingAt: { $gte: timeoutThreshold },
      });
    }

    return null;
  }

  async _getAndMarkJobs(extraConditions = {}) {
    const timeoutThreshold = Date.now() - this.timeoutMs;
    const now = Date.now();

    // 先原子性标记可用的jobs
    const [numUpdated] = await this.db.update(
      {
        queue: this.queue,
        ...extraConditions,
        $or: [
          { processingBy: { $exists: false } },
          { processingBy: null },
          { processingAt: { $lt: timeoutThreshold } },
        ],
      },
      { $set: { processingBy: this.processId, processingAt: now } }
    );

    if (numUpdated > 0) {
      // 返回被成功标记的jobs
      return this.db.find(
        {
          queue: this.queue,
          processingBy: this.processId,
          processingAt: { $gte: timeoutThreshold },
          ...extraConditions,
        },
        {},
        { createdAt: 1 }
      );
    }

    return [];
  }

  getJobs() {
    return this._getAndMarkJobs({ delay: { $exists: false } });
  }

  getScheduledJobs() {
    const now = Date.now();
    return this._getAndMarkJobs({
      delay: { $exists: true },
      willRunAt: { $lte: now },
      cancelled: false,
    });
  }

  async updateJob(id, updates) {
    const timeoutThreshold = Date.now() - this.timeoutMs;
    const now = Date.now();

    const [numUpdated] = await this.db.update(
      {
        queue: this.queue,
        id,
        $or: [
          { processingBy: this.processId },
          { processingBy: { $exists: false } },
          { processingBy: null },
          { processingAt: { $lt: timeoutThreshold } },
        ],
      },
      { $set: { ...updates, updatedAt: now, processingBy: this.processId, processingAt: now } }
    );

    if (numUpdated === 0) {
      throw new CustomError('JOB_NOT_FOUND', `Job ${id} does not exist or is being processed by another process`);
    }

    // 查询并返回更新后的job
    return this.db.findOne({ queue: this.queue, id });
  }

  async addJob(id, job, attrs = {}) {
    const exist = await this.db.findOne({ queue: this.queue, id });
    if (exist) {
      throw new CustomError('JOB_DUPLICATE', `Job ${id} already exist`);
    }
    const entityId = job.teamDid || job.did || job.entityId || job.appDid || '';
    return this.db.insert({
      id,
      job,
      queue: this.queue,
      entityId,
      retryCount: 1,
      cancelled: false,
      processingBy: null,
      processingAt: null,
      ...attrs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async deleteJob(id) {
    const data = await this.db.remove({ queue: this.queue, id });
    return data;
  }

  loadDatabase(cb) {
    return this.db.loadDatabase(cb);
  }
}

module.exports = SequelizeStore;
