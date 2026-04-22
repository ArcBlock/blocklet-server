const pick = require('lodash/pick');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:tag');
const { Joi } = require('@arcblock/validator');

const taggingSchema = Joi.object({
  tagId: Joi.number().required(),
  taggableIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'any.required': 'Must specify tagging.taggableIds to create',
    'array.base': 'taggableIds must be an array',
    'array.min': 'taggableIds must contain at least one element',
  }),
  taggableType: Joi.string().required().messages({
    'any.required': 'Must specify tagging.taggableType to create',
    'string.base': 'taggableType must be a string',
  }),
});

/**
 * Create tagging
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tagging - Tagging data
 * @returns {Promise<Array>}
 */
async function createTagging(api, { teamDid, tagging }) {
  const state = await api.getTaggingState(teamDid);

  const { error, value } = taggingSchema.validate(tagging, { stripUnknown: true });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join('; '));
  }

  const fns = value.taggableIds.map(async (id) => {
    const found = await state.findOne({ tagId: tagging.tagId, taggableId: id });
    if (found) return found;

    return state.insert({ tagId: tagging.tagId, taggableId: id, taggableType: tagging.taggableType });
  });

  const docs = await Promise.all(fns);
  logger.info('tagging created successfully', { teamDid, tagging });
  return docs;
}

/**
 * Delete tagging
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tagging - Tagging data
 * @returns {Promise<Array>}
 */
async function deleteTagging(api, { teamDid, tagging }) {
  const { error, value } = taggingSchema.validate(tagging, { stripUnknown: true });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join('; '));
  }

  const state = await api.getTaggingState(teamDid);

  const { tagId, taggableIds } = value;
  const fns = taggableIds.map((id) => {
    return state.remove({ tagId, taggableId: id });
  });

  const docs = await Promise.all(fns);
  logger.info('tagging deleted successfully', { teamDid, tagging });

  return docs;
}

/**
 * Get tag
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tag - Tag data
 * @returns {Promise<Object>}
 */
async function getTag(api, { teamDid, tag }) {
  const state = await api.getTagState(teamDid);
  return state.findOne({ id: tag.id });
}

/**
 * Create tag
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tag - Tag data
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createTag(api, { teamDid, tag }, context = {}) {
  if (!tag.title) {
    throw new Error('Must specify tag.title to create');
  }
  if (!tag.color || !tag.color.match(/^#[0-9a-f]{6}$/i)) {
    throw new Error('Must specify hex encoded tag.color to create');
  }
  if (!tag.slug) {
    throw new Error('Must specify tag.slug to create');
  }

  const state = await api.getTagState(teamDid);
  const tagData = pick(tag, ['title', 'description', 'color', 'slug', 'type', 'componentDid', 'parentId']);
  tagData.createdBy = context.user.did;
  tagData.updatedBy = context.user.did;
  const doc = await state.insert(tagData);
  logger.info('tags created successfully', { teamDid, tag });
  return doc;
}

/**
 * Update tag
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tag - Tag data
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateTag(api, { teamDid, tag }, context = {}) {
  if (!tag.id) {
    throw new Error('Must specify tag.id to update');
  }

  const keys = ['title', 'description', 'color', 'slug', 'type', 'componentDid', 'parentId'];
  const tagData = Object.fromEntries(keys.map((key) => [key, tag[key] ?? null]));
  tagData.updatedBy = context.user.did;

  const state = await api.getTagState(teamDid);
  const result = await state.updateById(tag.id, tagData);
  logger.info('tags updated successfully', { teamDid, tag, result });
  return state.findOne({ id: tag.id });
}

/**
 * Delete tag
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.tag - Tag data
 * @param {number} params.moveTo - Move to tag id
 * @returns {Promise<Object>}
 */
async function deleteTag(api, { teamDid, tag, moveTo }) {
  if (!tag.id) {
    throw new Error('Must specify tag.id to delete');
  }

  const state = await api.getTagState(teamDid);
  const taggingState = await api.getTaggingState(teamDid);

  if (moveTo) {
    const records = await taggingState.find({ tagId: tag.id });
    const checkPairs = records.map((r) => ({ taggableId: r.taggableId, taggableType: r.taggableType }));
    const existing = await taggingState.find({ tagId: moveTo, $or: checkPairs });

    const existingSet = new Set(existing.map((e) => `${e.taggableId}:${e.taggableType}`));
    const toUpdate = [];
    const toDelete = [];

    for (const record of records) {
      const key = `${record.taggableId}:${record.taggableType}`;
      if (existingSet.has(key)) {
        toDelete.push(record);
        logger.info('tag already at moveTo, will delete record', { teamDid, tag, record });
      } else {
        toUpdate.push(record);
      }
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((record) =>
          taggingState
            .update(
              { tagId: record.tagId, taggableId: record.taggableId, taggableType: record.taggableType },
              { $set: { tagId: moveTo } }
            )
            .then(() => {
              logger.info('tag moved successfully', { teamDid, tag, record, moveTo });
            })
        )
      );
    }

    if (toDelete.length > 0) {
      await Promise.all(
        toDelete.map((record) =>
          taggingState.remove(record).then(() => {
            logger.info('tagging deleted successfully', { teamDid, tag, record });
          })
        )
      );
    }
  }

  const doc = await state.remove({ id: tag.id });
  await taggingState.remove({ tagId: tag.id });
  logger.info('tags deleted successfully', { teamDid, tag });
  return doc;
}

/**
 * Get tags
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.paging - Paging options
 * @returns {Promise<Object>}
 */
async function getTags(api, { teamDid, paging }) {
  const state = await api.getTagState(teamDid);
  const result = await state.paginate({}, { createdAt: -1 }, { pageSize: 20, ...paging });
  return { tags: result.list, paging: result.paging };
}

module.exports = {
  taggingSchema,
  createTagging,
  deleteTagging,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getTags,
};
