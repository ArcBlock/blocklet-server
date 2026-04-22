import JOI, { Root } from 'joi';
import { didExtension } from '@blocklet/meta/lib/extension';

const Joi: Root & { [key: string]: Function } = JOI.extend(didExtension);
const TYPES = {
  NOTIFICATION: 'notification',
  CONNECT: 'connect',
  FEED: 'feed',
  HI: 'hi',
  PASSTHROUGH: 'passthrough',
};

const SEVERITIES = {
  NORMAL: 'normal',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
};

const ATTACHMENT_TYPES = {
  ASSET: 'asset',
  VC: 'vc',
  TOKEN: 'token',
  TEXT: 'text',
  IMAGE: 'image',
  DIVIDER: 'divider',
  TRANSACTION: 'transaction',
  DAPP: 'dapp',
  LINK: 'link',
  SECTION: 'section',
};

const ACTIVITY_TYPES = {
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  TIPS: 'tips',
  MENTION: 'mention',
  ASSIGN: 'assign',
  UN_ASSIGN: 'un_assign',
};

const ACTIVITY_TARGET_TYPES = {
  DISCUSSION: 'discussion',
  BLOG: 'blog',
  DOC: 'doc',
  BOOKMARK: 'bookmark',
  COMMENT: 'comment',
  USER: 'user',
};

const utmSchema = Joi.object({
  source: Joi.string().optional(),
  medium: Joi.string().optional(),
  campaign: Joi.string().optional(),
  content: Joi.string().optional(),
}).meta({ className: 'TUTM' });

const assetSchema = Joi.object({
  did: Joi.DID().trim().required(),
  chainHost: Joi.string().uri().required(),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TDataAsset' });

const vcSchema = Joi.object({
  credential: Joi.object().required().unknown(true),
  tag: Joi.string(),
})
  .required()
  .meta({ className: 'TDataVC', unknownType: 'any' });

const tokenSchema = Joi.object({
  address: Joi.DID().trim().allow(''),
  amount: Joi.string().required(),
  symbol: Joi.string().required(),
  senderDid: Joi.DID().trim().required(),
  chainHost: Joi.string().uri().required(),
  decimal: Joi.number().integer().required(),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TDataToken' });

const textSchema = Joi.object({
  type: Joi.string().required(),
  text: Joi.string().required(),
  color: Joi.string().min(0),
  size: Joi.string().valid('small', 'normal', 'big'),
})
  .required()
  .meta({ className: 'TDataText' });

const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  alt: Joi.string().min(0),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TDataImage' });

const transactionSchema = Joi.object({
  hash: Joi.string().required(),
  chainId: Joi.string().required(),
})
  .required()
  .meta({ className: 'TDataTransaction' });

const dappSchema = Joi.object({
  url: Joi.string().uri().required(),
  appDID: Joi.DID().trim().required(),
  logo: Joi.string().uri().required(),
  title: Joi.string().required(),
  desc: Joi.string().min(0),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TDataDapp' });

const linkSchema = Joi.object({
  url: Joi.string().uri().required(),
  description: Joi.string().min(0),
  title: Joi.string().min(0),
  image: Joi.string().uri().min(0),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TDataLink' });

const actionSchema = Joi.object({
  name: Joi.string().required(),
  title: Joi.string(),
  color: Joi.string(),
  bgColor: Joi.string(),
  link: Joi.string().uri(),
  utm: utmSchema.optional(),
}).meta({ className: 'TNotificationAction' });

const attachmentSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ATTACHMENT_TYPES))
    .required(),
  data: Joi.when('type', {
    switch: [
      { is: ATTACHMENT_TYPES.ASSET, then: assetSchema },
      { is: ATTACHMENT_TYPES.VC, then: vcSchema },
      { is: ATTACHMENT_TYPES.TOKEN, then: tokenSchema },
      { is: ATTACHMENT_TYPES.TEXT, then: textSchema },
      { is: ATTACHMENT_TYPES.IMAGE, then: imageSchema },
      { is: ATTACHMENT_TYPES.TRANSACTION, then: transactionSchema },
      { is: ATTACHMENT_TYPES.DAPP, then: dappSchema },
      { is: ATTACHMENT_TYPES.LINK, then: linkSchema },
      { is: ATTACHMENT_TYPES.DIVIDER, then: Joi.object({}) },
    ],
  }),
  fields: Joi.when('type', {
    is: ATTACHMENT_TYPES.SECTION,
    then: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(ATTACHMENT_TYPES.TEXT).required(),
        data: textSchema,
      })
    ),
  }),
}).meta({ className: 'TNotificationAttachment' });

const notificationTypeSchema = Joi.object({
  type: Joi.string().valid(TYPES.NOTIFICATION),
  title: Joi.string(),
  body: Joi.string(),
  severity: Joi.string().valid(...Object.values(SEVERITIES)),
  blocks: Joi.array().items(attachmentSchema).default([]),
  attachments: Joi.array().items(attachmentSchema).default([]),
  actions: Joi.array().items(actionSchema).default([]),
})
  .required()
  .meta({ className: 'TNotificationItem' });

const connectTypeSchema = Joi.object({
  type: Joi.string().valid(TYPES.CONNECT),
  url: Joi.string().uri().required(),
  checkUrl: Joi.string().uri(),
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TNotificationConnect' });

const feedTypeSchema = Joi.object({
  type: Joi.string().valid(TYPES.FEED),
  feedType: Joi.string().required(),
  data: Joi.object().required(),
})
  .required()
  .meta({ className: 'TNotificationFeed' });

const activityTargetSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ACTIVITY_TARGET_TYPES))
    .required(),
  id: Joi.string().required(),
  name: Joi.when('type', {
    is: ACTIVITY_TARGET_TYPES.USER,
    then: Joi.forbidden(),
    otherwise: Joi.string().allow('').optional(),
  }),
  desc: Joi.when('type', {
    is: ACTIVITY_TARGET_TYPES.USER,
    then: Joi.forbidden(),
    otherwise: Joi.string().allow('').optional(),
  }),
  author: Joi.when('type', {
    is: ACTIVITY_TARGET_TYPES.USER,
    then: Joi.forbidden(),
    otherwise: Joi.string().allow('').optional(),
  }),
  image: Joi.when('type', {
    is: ACTIVITY_TARGET_TYPES.USER,
    then: Joi.forbidden(),
    otherwise: Joi.string().allow('').optional(),
  }),
  utm: utmSchema.optional(),
}).meta({ className: 'TActivityTarget' });

const notificationActivitySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ACTIVITY_TYPES))
    .required(),
  actor: Joi.DID().trim().required(),
  target: activityTargetSchema.required(),
  meta: Joi.when('type', {
    is: ACTIVITY_TYPES.TIPS,
    then: Joi.object({
      amount: Joi.number().required(),
      symbol: Joi.string().required(),
      chainId: Joi.string().required(),
    }).required(),
    otherwise: Joi.when('type', {
      is: ACTIVITY_TYPES.COMMENT,
      then: Joi.object({
        id: Joi.string().required(),
        content: Joi.string().required(),
        utm: utmSchema.optional(),
      }).required(),
      otherwise: Joi.object().optional(),
    }),
  }),
}).meta({ className: 'TNotificationActivity' });

const notificationSchema = Joi.object({
  type: Joi.string().valid(...Object.values(TYPES)),

  id: Joi.string().optional(),
  // feed type
  feedType: Joi.string(),
  passthroughType: Joi.string(),

  data: Joi.object(),

  // connect type
  url: Joi.string().uri(),
  checkUrl: Joi.string(),

  source: Joi.string(),

  // notification type
  title: Joi.string().allow(''),
  body: Joi.string(),
  severity: Joi.string().valid(...Object.values(SEVERITIES)),
  blocks: Joi.array().items(attachmentSchema).default([]),
  attachments: Joi.array().items(attachmentSchema).default([]),
  actions: Joi.array().items(actionSchema).default([]),
  appInfo: Joi.object().optional(),
  poweredBy: Joi.object().optional(),

  // notification activity v1.16.41
  activity: notificationActivitySchema.optional(),

  // utm params >= 1.16.52
  utm: utmSchema.optional(),
})
  .required()
  .meta({ className: 'TNotification' });

const messageSchema = Joi.object({
  id: Joi.string().required(),
  createdAt: Joi.date().iso().required(),
  type: Joi.string().required(),
  receiver: Joi.object({
    did: Joi.DID().trim().required(),
  }).required(),
})
  .unknown()
  .required()
  .meta({ className: 'TMessage', unknownType: 'any' });

const receiverSchema = Joi.alternatives().try(
  Joi.DID().trim().required().meta({ className: 'TReceiver' }),
  Joi.string().valid('*').meta({ className: 'TReceiver' })
);

const inputNotificationSchema = Joi.array()
  .items(notificationSchema)
  .single()
  .required()
  .meta({ className: 'TNotificationInput' });

const inputReceiverSchema = Joi.array().items(receiverSchema).single().required().meta({ className: 'TReceiverInput' });

const optionSchema = Joi.object({
  keepForOfflineUser: Joi.boolean(),
  locale: Joi.string(),
  channels: Joi.array()
    .items(Joi.allow('app', 'email', 'push', 'webhook'))
    .optional(),
  ttl: Joi.number().integer().min(0).max(7200).optional(), // 0–7200 minutes
  allowUnsubscribe: Joi.boolean().optional(),
})
  .unknown()
  .meta({ className: 'TSendOptions', unknownType: 'any' });

const channelEventSchema = Joi.string().required().meta({ className: 'TChannelEvent' });

const schemaEmail = Joi.string().email().required();

export const validateReceiver = inputReceiverSchema.validateAsync.bind(inputReceiverSchema);
export const validateNotification = inputNotificationSchema.validateAsync.bind(inputNotificationSchema);
export const validateMessage = messageSchema.validateAsync.bind(messageSchema);
export const validateChannelEvent = channelEventSchema.validateAsync.bind(channelEventSchema);
export const validateOption = optionSchema.validateAsync.bind(optionSchema);
export const validateEmail = schemaEmail.validateAsync.bind(schemaEmail);
export const validateActivity = notificationActivitySchema.validateAsync.bind(notificationActivitySchema);

export { tokenSchema };
export { actionSchema };
export { assetSchema };
export { vcSchema };
export { transactionSchema };
export { textSchema };
export { linkSchema };
export { imageSchema };
export { dappSchema };
export { attachmentSchema };
export { notificationSchema };
export { messageSchema };
export { optionSchema };
export { channelEventSchema };
export { TYPES as NOTIFICATION_TYPES };
export { inputNotificationSchema, notificationTypeSchema, connectTypeSchema, feedTypeSchema };
export { ACTIVITY_TYPES, ACTIVITY_TARGET_TYPES };
export { notificationActivitySchema };
export { activityTargetSchema };
export { utmSchema };

export default {
  validateReceiver,
  validateNotification,
  validateMessage,
  validateChannelEvent,
  validateOption,
  tokenSchema,
  actionSchema,
  assetSchema,
  vcSchema,
  transactionSchema,
  textSchema,
  linkSchema,
  imageSchema,
  dappSchema,
  attachmentSchema,
  notificationSchema,
  messageSchema,
  optionSchema,
  channelEventSchema,
  NOTIFICATION_TYPES: TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_TARGET_TYPES,
  validateActivity,
  notificationActivitySchema,
  activityTargetSchema,
  utmSchema,
};
