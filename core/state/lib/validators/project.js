const { Joi, titleSchema, descriptionSchema } = require('@blocklet/meta/lib/schema');
const { PROJECT } = require('@blocklet/constant');

const note = Joi.string().min(1).max(PROJECT.MAX_NOTE_LENGTH);
const blockletIntroduction = Joi.string().max(PROJECT.MAX_INTRO_LENGTH).allow('').allow(null);
const blockletScreenshots = Joi.array().items(Joi.string().min(1).max(200));
const blockletLogo = Joi.string().max(200).allow(null).allow('');
const uploadedResource = Joi.string().max(255).allow(null).allow('');

const createReleaseSchema = (status) =>
  Joi.object({
    note: status === PROJECT.RELEASE_STATUS.published ? note.required() : note.allow(''),
    blockletVersion: Joi.semver().valid().required(),
    blockletTitle: titleSchema.required(),
    blockletHomepage: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .optional()
      .allow('')
      .default(''),
    blockletRepository: Joi.alternatives()
      .try(
        Joi.string().min(1),
        Joi.object({
          type: Joi.string().valid('git', 'https', 'svn').required(),
          url: Joi.string().uri().required(),
          directory: Joi.string(),
        })
      )
      .optional()
      .allow('')
      .default(''),
    blockletVideos: Joi.array()
      .items(
        Joi.string()
          // eslint-disable-next-line no-useless-escape
          .pattern(/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[\w\-\/?&=]+/)
          .message('Each video URL must be a valid YouTube or Vimeo link')
      )
      .max(3)
      .optional()
      .default([]),
    blockletSupport: Joi.alternatives()
      .try(Joi.string().uri({ scheme: ['http', 'https'] }), Joi.string().email({ tlds: false }))
      .optional()
      .allow('')
      .default(''),
    blockletCommunity: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .optional()
      .allow('')
      .default(''),
    blockletDescription:
      status === PROJECT.RELEASE_STATUS.published
        ? descriptionSchema.required()
        : descriptionSchema.allow('').allow(null),
    blockletScreenshots,
    blockletIntroduction,
    blockletLogo,
    blockletResourceType: Joi.string().valid('resource', 'pack', '').optional(),
    blockletComponents: Joi.array().items(
      Joi.object({
        did: Joi.string().min(1).required(),
        required: Joi.boolean().allow(null),
      })
    ),
    contentType: Joi.string().valid('blocklet', 'upload', 'docker'),
    blockletDocker: Joi.object({
      dockerImage: Joi.string().allow('').default(''),
      dockerCommand: Joi.string().allow('').default('').optional(),
      dockerArgs: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required(),
            value: Joi.alternatives()
              .try(Joi.string().required(), Joi.array().items(Joi.string().required()))
              .required(),
            type: Joi.string().valid('docker', 'web').default('docker'),
            port: Joi.string().optional().allow('').default(''),
            prefix: Joi.string().optional().allow('').default(''),
            path: Joi.string().optional().allow('').default('/'),
            name: Joi.string().optional().allow('').default(''),
            protocol: Joi.string().optional().allow('').default(''),
            proxyBehavior: Joi.string().default('').optional(),
          })
        )
        .default([]),
      dockerEnvs: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required(),
            value: Joi.string().optional().allow('').default(''),
            description: Joi.string().optional().allow('').default(''),
            secure: Joi.boolean().optional().default(false),
            shared: Joi.boolean().optional().default(false),
            required: Joi.boolean().optional().default(false),
            custom: Joi.string().optional().allow('').default(''),
          })
        )
        .default([]),
    }).optional(),
    uploadedResource,
    blockletSingleton: Joi.boolean().optional().default(false),
  });

module.exports = {
  note,
  blockletIntroduction,
  blockletScreenshots,
  blockletLogo,
  uploadedResource,
  createReleaseSchema,
};
