import fs from 'fs';
import JOI, { CustomHelpers, Root } from 'joi';
import cjkLengthModule from 'cjk-length';
import isGlob from 'is-glob';
import { semver, semverRange } from 'joi-extension-semver';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Environment } from '@blocklet/server-js';
import isVarName from 'is-var-name';
// @ts-ignore
import { WELLKNOWN_BLOCKLET_LOGO_PATH } from '@abtnode/constant';
import { isValid } from '@arcblock/did';
import { dockerSchema } from '@abtnode/docker-utils';

import {
  BLOCKLET_GROUPS,
  BLOCKLET_PLATFORMS,
  BLOCKLET_ARCHITECTURES,
  BLOCKLET_INTERFACE_TYPES,
  BLOCKLET_INTERFACE_PROTOCOLS,
  BLOCKLET_ENTRY_FILE,
  BLOCKLET_BUNDLE_FILE,
  BLOCKLET_DEFAULT_PORT_NAME,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_LATEST_REQUIREMENT_SERVER,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
  BLOCKLET_APP_SPACE_REQUIREMENT,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@blocklet/constant';
import { toBlockletDid } from './did';
import { fileExtension, didExtension } from './extension';
import { validateName, validateNewDid } from './name';
import { urlPathFriendly, isValidUrlPath, checkLink } from './url-path-friendly';

const cjkLength = cjkLengthModule.default;

const WELLKNOWN_PATH_PREFIX = '/.well-known';

const Joi: Root & { [key: string]: Function } = JOI.extend(semver)
  .extend(semverRange)
  .extend(fileExtension)
  .extend(didExtension);

const checkLinkHelper = (value, helper: CustomHelpers<any>) => {
  if (checkLink(value)) {
    return value;
  }
  // @ts-expect-error
  return helper.message(`Invalid navigation link: ${value}

A valid navigation link should be a relative url which start with '/' or a absolute url, such as:
- /en/home
- /zh/home
- https://www.arcblock.io
`);
};
const checkId = (value, helper: CustomHelpers<any>) => {
  if (!value || isVarName(value)) {
    return value;
  }
  // @ts-expect-error
  return helper.message(`Invalid navigation id: ${value}

A valid navigation id is should follow the rules of javascript variables, such as:
- foo
- fooBar
- foo123

see detail in https://www.npmjs.com/package/is-var-name
`);
};

const titleSchema = Joi.string()
  .trim()
  .min(1)
  .custom((value: string) => {
    if (cjkLength(value) > MAX_TITLE_LENGTH) {
      throw new Error(
        `title length should not exceed ${MAX_TITLE_LENGTH} (see: https://www.npmjs.com/package/cjk-length)`
      );
    }
    return value;
  })
  .meta({ className: 'TTitle' });

const descriptionSchema = Joi.string().trim().min(3).max(160).meta({ className: 'TDescription' });

const installBlockletTitleSchema = Joi.string()
  .trim()
  .min(3)
  .max(20)
  .messages({ '*': 'Title length must be between 3 and 20 characters' })
  .meta({ className: 'TInstallBlockletTitle' });
const installBlockletDescriptionSchema = Joi.string()
  .trim()
  .min(3)
  .max(80)
  .messages({ '*': 'Description length must be between 3 and 80 characters' })
  .meta({ className: 'TInstallBlockletDescription' });

const logoSchema = Joi.string()
  .uri({ scheme: ['http', 'https'], allowRelative: true })
  .allow('')
  .custom((value: string, helper: CustomHelpers<any>) => {
    if (value.includes(WELLKNOWN_BLOCKLET_LOGO_PATH)) {
      // @ts-expect-error
      return helper.message(`logo url should not include ${WELLKNOWN_BLOCKLET_LOGO_PATH}`);
    }
    return value;
  })
  .meta({ className: 'TLogo' });

const baseMountPointSchema = Joi.string().trim().min(1);

const mountPointSchema = baseMountPointSchema
  .meta({ className: 'TMountPoint' })
  .custom((value: string, helper: CustomHelpers<any>) => {
    if (isValidUrlPath(value)) {
      return value;
    }

    // @ts-expect-error
    return helper.message('mountPoint cannot contain such characters space $*+~()\'"!:@\\');
  });

const updateMountPointSchema = baseMountPointSchema
  .meta({ className: 'TUpdateMountPoint' })
  .custom((value) => urlPathFriendly(value));

const blockletNameSchema = Joi.string()
  .custom((value: string) => {
    validateName(value);
    return value;
  })
  .meta({ className: 'TBlockletName' });

const ENV_NAME_WHITE_LIST = [];
const environmentNameSchema = Joi.string()
  .trim()
  .min(1)
  .max(50)
  .required()
  .custom((name: string, helper: CustomHelpers<any>) => {
    if (name.startsWith('BLOCKLET')) {
      if (!ENV_NAME_WHITE_LIST.includes(name)) {
        // @ts-expect-error
        return helper.message('Env name can not start with BLOCKLET_');
      }
    }

    if (name.startsWith('COMPONENT')) {
      // @ts-expect-error
      return helper.message('Env name can not start with COMPONENT_');
    }

    if (name.startsWith('ABTNODE')) {
      // @ts-expect-error
      return helper.message('Env name can not start with ABTNODE_');
    }

    if (/[^\w]/.test(name)) {
      // @ts-expect-error
      return helper.message('Env name can include only numbers or letters or "_"');
    }

    return name;
  })
  .meta({
    className: 'TEnvironmentName',
    unknownType: 'any',
  });

const environmentSchema = Joi.object({
  name: environmentNameSchema.required(),
  description: Joi.string().trim().required(),
  default: Joi.string().optional().allow('').default(''),
  required: Joi.boolean().default(false),
  secure: Joi.boolean().default(false),
  validation: Joi.string().optional(),
  shared: Joi.boolean().default((parent: Environment) => (parent.secure ? false : undefined)),
})
  .custom((x: Environment, helper: CustomHelpers<any>) => {
    if (x.secure && x.default) {
      // @ts-expect-error
      return helper.message(`Cannot declare default value for secure env ${x.name}`);
    }
    return x;
  })
  .meta({
    className: 'TEnvironment',
    unknownType: 'any',
  });

const scriptsSchema = Joi.object({
  dev: Joi.string().trim().min(1),
  e2eDev: Joi.string().trim().min(1),
  preFlight: Joi.string().trim().min(1),
  preInstall: Joi.string().trim().min(1),
  postInstall: Joi.string().trim().min(1),
  preStart: Joi.string().trim().min(1),
  postStart: Joi.string().trim().min(1),
  preStop: Joi.string().trim().min(1),
  preUninstall: Joi.string().trim().min(1),
  preConfig: Joi.string().trim().min(1),
})
  .rename('pre-flight', 'preFlight')
  .rename('pre-install', 'preInstall')
  .rename('post-install', 'postInstall')
  .rename('pre-start', 'preStart')
  .rename('post-start', 'postStart')
  .rename('pre-stop', 'preStop')
  .rename('pre-uninstall', 'preUninstall')
  .rename('pre-config', 'preConfig')
  .optional()
  .meta({
    className: 'TScripts',
    unknownType: 'any',
  });

// Different services have different config schema
// - Auth: https://github.com/ArcBlock/abtnode-docs/blob/master/src/developer/auth-service/index.md
const serviceSchema = Joi.object({
  name: Joi.string().required().trim(),
  config: Joi.object().optional().default({}),
})
  .unknown(true)
  .meta({
    className: 'TService',
    unknownType: 'any',
  });

const endpointSchema = Joi.object({
  type: Joi.string().trim(true).min(1).required(),
  path: Joi.string().required(),
  meta: Joi.object({
    vcType: Joi.string(),
    payable: Joi.boolean(),
    params: Joi.array().items({
      name: Joi.string().required().trim(),
      description: Joi.string().required().trim(),
    }),
  }),
}).meta({
  className: 'TEndpoint',
  unknownType: 'any',
});

const cacheableSchema = Joi.string()
  .trim()
  .custom((value: any, helpers: CustomHelpers<any>) => {
    const parts = value.split('/').filter(Boolean);
    if (parts.length === 0) {
      // @ts-ignore
      return helpers.message('cacheable path must be a valid pathname that is not /');
    }

    return `/${parts.join('/')}`;
  })
  .meta({
    className: 'TPathPrefix',
    unknownType: 'any',
  });

const interfaceSchema = Joi.object({
  type: Joi.string()
    .lowercase()
    .valid(...BLOCKLET_INTERFACE_TYPES)
    .required(),
  // Human readable name of the interface, such as `public_url`
  name: Joi.string().trim().required(),
  // The path where the interface is served from the blocklet
  path: Joi.string().trim().default('/'),
  // `*` means the interface can be mounted at any path prefix
  prefix: Joi.string().trim().min(1).default(BLOCKLET_DYNAMIC_PATH_PREFIX),
  containerPort: Joi.number().port().optional(),
  hostIP: Joi.string()
    .trim()
    .ip({ version: ['ipv4', 'ipv6'] })
    .optional(),
  protocol: Joi.string()
    .lowercase()
    .valid(...BLOCKLET_INTERFACE_PROTOCOLS)
    .default('http'),
  // Can be a string or an object
  port: Joi.alternatives()
    .try(
      Joi.string().uppercase().default(BLOCKLET_DEFAULT_PORT_NAME),
      Joi.object({
        internal: Joi.string().uppercase().required(),
        external: Joi.number().port().required(),
      })
    )
    .default(BLOCKLET_DEFAULT_PORT_NAME),
  cacheable: Joi.array().items(cacheableSchema).unique(),
  services: Joi.array().items(serviceSchema).unique('name'),
  endpoints: Joi.array().items(endpointSchema).unique('type'),
  pageGroups: Joi.array().items(Joi.string().min(1).max(255).trim()).unique(),
  proxyBehavior: Joi.string().valid('service', 'direct').default('service').optional(),
}).meta({
  className: 'TInterface',
  unknownType: 'any',
});

const engineSourceSchema = Joi.alternatives().try(
  Joi.string().required(),
  Joi.object({
    url: Joi.string()
      .uri({ scheme: ['http', 'https', 'file'] })
      .required(),
    name: blockletNameSchema.required(),
    version: Joi.alternatives().try(Joi.string().valid('latest'), Joi.semverRange().valid()),
  }),
  Joi.object({
    store: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    name: blockletNameSchema.required(),
    version: Joi.alternatives().try(Joi.string().valid('latest'), Joi.semverRange().valid()).default('latest'),
  })
);

const engineSchema = Joi.object({
  platform: Joi.string()
    .valid(...BLOCKLET_PLATFORMS)
    .optional(),
  interpreter: Joi.string().valid('binary', 'node', 'blocklet', 'bun').default('node'),
  source: engineSourceSchema,
  args: Joi.array().items(Joi.string()).optional().default([]),
}).meta({
  className: 'TEngine',
  unknownType: 'any',
});

const personSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email({ tlds: false }).optional(),
  url: Joi.string().uri().optional(),
}).meta({
  className: 'TPerson',
  unknownType: 'any',
});

const distSchema = Joi.object({
  tarball: Joi.alternatives().try(Joi.string().uri(), Joi.string()).required(),
  integrity: Joi.string().required(),
  size: Joi.number().optional(),
}).meta({
  className: 'TDist',
  unknownType: 'any',
});

const statsSchema = Joi.object({
  downloads: Joi.number().integer().greater(-1),
  star: Joi.number().default(0),
  purchases: Joi.number().default(0),
}).meta({
  className: 'TStats',
  unknownType: 'any',
});

const componentSourceSchema = Joi.alternatives().try(
  Joi.object({
    url: Joi.alternatives().try(Joi.string().uri(), Joi.array().items(Joi.string().uri()).min(1)).required(),
    // Unlike the store, a URL source cannot resolve a specific version; the version field can still constrain the acceptable range
    version: Joi.alternatives().try(Joi.string().valid('latest'), Joi.semverRange().valid()),
  }),
  Joi.object({
    store: Joi.string().uri({ scheme: ['http', 'https'] }),
    name: blockletNameSchema.required(),
    // TODO: Currently only pinned versions are supported; adaptive ranges like 4.x need to be supported
    version: Joi.alternatives().try(Joi.string().valid('latest'), Joi.semverRange().valid()).default('latest'),
  })
);

const componentSchemaProps = {
  source: componentSourceSchema.required(),

  // Can the dynamic component be deleted before I delete myself
  required: Joi.boolean(),

  // These props in dynamic component is for suggestion only and can be changed by user or other dynamic component
  title: titleSchema,
  description: descriptionSchema,
  mountPoint: mountPointSchema,

  // backward compatible, useless
  name: blockletNameSchema,
};

const createComponentSchema = (schema, allowEmptyStore?: boolean) =>
  Joi.object(schema).custom((value: any, helper: CustomHelpers<any>) => {
    if (!allowEmptyStore && value.source && value.source.name && !value.source.store) {
      // @ts-expect-error
      return helper.message(`missing 'store' in source of component ${value.name}`);
    }
    return value;
  });

const componentSchema = createComponentSchema(componentSchemaProps).meta({
  className: 'TComponent',
  unknownType: 'any',
});
const componentSchemaWithoutStoreCheck = createComponentSchema(componentSchemaProps, true);

const componentsSchema = ({ checkStore }: { checkStore?: boolean } = {}) => {
  const arr = [componentSchema, componentSchemaWithoutStoreCheck];
  const schema = Joi.array()
    .items(checkStore ? arr[0] : arr[1])
    .optional()
    .default([]);

  return schema;
};

const signatureSchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  signer: Joi.string().required(),
  pk: Joi.string().required(),
  created: Joi.string().isoDate().required(),
  sig: Joi.string().required(),
  excludes: Joi.array().items(Joi.string()).optional(),
  appended: Joi.array().items(Joi.string()).optional(),
  // Fields required for delegation token validation
  delegatee: Joi.string(),
  delegateePk: Joi.string(),
  delegation: Joi.string(),
}).meta({
  className: 'TSignature',
  unknownType: 'any',
});

const localeList = ['en', 'zh', 'fr', 'ru', 'ar', 'es', 'de', 'pt', 'ja', 'hi'];

const navigationItemProps = {
  id: Joi.string().custom(checkId),
  title: Joi.alternatives()
    .try(
      Joi.string().min(1).max(MAX_TITLE_LENGTH),
      Joi.object()
        .min(1)
        .pattern(Joi.string().valid(...localeList), Joi.string().min(1).max(MAX_TITLE_LENGTH))
    )
    .required(),
  description: Joi.alternatives().try(
    Joi.string().min(1).max(MAX_DESCRIPTION_LENGTH),
    Joi.object()
      .min(1)
      .pattern(Joi.string().valid(...localeList), Joi.string().min(1).max(MAX_DESCRIPTION_LENGTH))
  ),
  link: Joi.alternatives().try(
    Joi.string().custom(checkLinkHelper),
    Joi.object()
      .min(1)
      .pattern(Joi.string().valid(...localeList), Joi.string().custom(checkLinkHelper))
  ),
  component: Joi.string().min(1),
  section: Joi.array()
    .items(
      Joi.string().valid(
        'header',
        'footer',
        'bottom',
        'social',
        'dashboard',
        'sessionManager',
        'userCenter',
        'bottomNavigation'
      )
    )
    .single(),
  role: Joi.array().items(Joi.string().min(1)).single(),
  icon: Joi.string().min(1),
  visible: Joi.boolean(),
  private: Joi.boolean(), // Whether the item is private (hidden when viewing another user's personal center)
};

const navigationItemSchema = Joi.object({
  ...navigationItemProps,
  items: Joi.array().items(Joi.object({ ...navigationItemProps }).rename('child', 'component')),
})
  .rename('child', 'component')
  .meta({
    className: 'TNavigationItem',
    unknownType: 'any',
  });

const navigationSchema = Joi.array()
  .items(navigationItemSchema)
  .unique((a, b) => {
    if (a.id && b.id) {
      return a.id === b.id;
    }
    return false;
  })
  .meta({
    className: 'TNavigation',
    unknownType: 'any',
  });

const themeSchema = Joi.object({
  background: Joi.alternatives().try(
    Joi.string().min(1),
    Joi.object({
      header: Joi.string().min(1),
      footer: Joi.string().min(1),
      default: Joi.string().min(1),
    }).min(1)
  ),
}).meta({
  className: 'TTheme',
  unknownType: 'any',
});

const authConfigSchema = Joi.object({
  whoCanAccess: Joi.string().valid('owner', 'invited', 'all'),
  profileFields: Joi.array() // deprecated
    .items(Joi.string().valid('fullName', 'email', 'avatar', 'phone'))
    .unique(),
  ignoreUrls: Joi.array().items(Joi.string().min(1)),
  allowSwitchProfile: Joi.boolean(),
  blockUnauthenticated: Joi.boolean(),
  blockUnauthorized: Joi.boolean(),
})
  .options({ stripUnknown: true })
  .meta({
    className: 'TAuthConfig',
    unknownType: 'any',
  });

const resourceTypeSchema = Joi.object({
  type: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().min(1),
});

const resourceBundleSchema = Joi.object({
  did: Joi.DID().trim().required(),
  type: Joi.string().trim().min(1).required(),
  public: Joi.boolean(),
}).meta({
  className: 'TResourceBundle',
  unknownType: 'any',
});

const eventsSchema = Joi.array()
  .items(
    Joi.object({
      type: Joi.string()
        .trim()
        .min(1)
        .max(128)
        .pattern(/^(?!blocklet\.)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/)
        .message(
          'Event type must be in format of "[noun.]verb" like "post.published" or "post.comment.published", and prefix "blocklet." is reserved'
        )
        .required(),
      description: Joi.string().trim().min(1).max(256).required(),
    })
  )
  .unique('type')
  .meta({
    className: 'TEvent',
    unknownType: 'any',
  });

const blockletMetaProps = {
  did: Joi.DID().trim().required(),
  version: Joi.semver().valid().required(),
  name: Joi.string().optional(),
  description: descriptionSchema.required(),
  group: Joi.string().valid(...BLOCKLET_GROUPS),
  main: Joi.string().trim(),
  title: titleSchema.optional().allow(''),
  logo: Joi.string().trim().optional(),
  specVersion: Joi.semver().valid().gte('1.0.0').optional(),
  author: personSchema.optional(),
  contributors: Joi.array().items(personSchema).optional(),
  maintainers: Joi.array().items(personSchema).optional(),
  community: Joi.string().uri().optional().allow('').default(''),
  documentation: Joi.string().uri().optional().allow('').default(''),
  homepage: Joi.string().uri().optional().allow('').default(''),
  license: Joi.string().optional().allow('').default(''),
  support: Joi.alternatives()
    .try(Joi.string().uri(), Joi.string().email({ tlds: false }))
    .optional(),
  // which asset factory to mint blocklet purchase nft
  // This is usually created and maintained by `blocklet publish` command
  nftFactory: Joi.DID().optional().allow('').default(''),
  // Set the price and share of the blocklet
  payment: Joi.object({
    // Currently only supports 1 token
    price: Joi.array()
      .max(1)
      .items(
        Joi.object({
          value: Joi.number().greater(0).required(),
          address: Joi.DID().required(), // token address
        })
      )
      .default([]),
    // List of beneficiaries that share the token earns from blocklet purchase
    // If left empty, blocklet publish workflow will enforce both the developer and the registry account
    // If not, the blocklet publish workflow will enforce the registry account
    // In theory, the developer can split as many share as he wants
    // Such as, some developers coauthored the blocklet, and their income get instant settlement on blocklet purchase
    // For performance reasons, we need to set a hard limit for share count
    share: Joi.array()
      .max(4)
      .items(
        Joi.object({
          name: Joi.string().required(),
          address: Joi.DID().required(),
          value: Joi.number().greater(0).max(1).required(),
        })
      )
      .default([])
      .custom((value: Array<{ name: string; address: string; value: number }>) => {
        // If share is not empty, the total value should be 1
        if (value.length === 0) {
          return value;
        }
        const total = value.reduce((acc, cur) => acc + cur.value, 0);

        if (total !== 1) {
          throw new Error(`Invalid blocklet payment share config: total share must be 1, got ${total}`);
        }
        return value;
      }, 'invalid blocklet share'),
    componentPrice: Joi.array()
      .items(
        Joi.object({
          parentPriceRange: Joi.array()
            .items(Joi.number())
            // FIXME
            // FIXME: Handle edge cases: overlapping ranges, non-contiguous ranges, boundary conditions
            .custom((value: number[], helper: CustomHelpers<any>) => {
              if (value.length !== 2) {
                // @ts-ignore
                return helper.message('length of range should be 2');
              }
              if (value[0] < 0) {
                // @ts-ignore
                return helper.message('the first value should not less than 0 in range');
              }
              if (value[1] <= value[0]) {
                // @ts-ignore
                return helper.message('the second value should greater than the first value in range');
              }
              return value;
            }),
          type: Joi.string().valid('fixed', 'percentage').required(),
          value: Joi.number().greater(0).required(),
        })
      )
      .single(),
  }).default({ price: [], share: [] }),
  keywords: Joi.alternatives()
    .try(Joi.string().trim().min(1), Joi.array().items(Joi.string().min(1)))
    .optional(),
  tags: Joi.alternatives()
    .try(Joi.string().trim().min(1), Joi.array().items(Joi.string().min(1)))
    .optional(),
  gitHash: Joi.string().optional().allow(''),
  repository: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.object({
        type: Joi.string().valid('git', 'https', 'svn').required(),
        url: Joi.string().uri().required(),
        directory: Joi.string(),
      })
    )
    .optional(),
  timeout: Joi.object({
    start: Joi.number().min(10).max(600), // start check timeout, 10 seconds ~ 10 minutes
    script: Joi.number().min(1).max(1800), // hook/migration timeout, 1 seconds ~ 30 minutes
  }).default({ start: 60 }),
  requirements: Joi.object({
    abtnode: Joi.semverRange().valid(),
    server: Joi.semverRange().valid(),
    os: Joi.alternatives().try(
      Joi.string().valid('*', ...BLOCKLET_PLATFORMS),
      Joi.array()
        .items(Joi.string().valid(...BLOCKLET_PLATFORMS))
        .min(1)
    ),
    cpu: Joi.alternatives().try(
      Joi.string().valid('*', ...BLOCKLET_ARCHITECTURES),
      Joi.array()
        .items(Joi.string().valid(...BLOCKLET_ARCHITECTURES))
        .min(1)
    ),
    fuels: Joi.array().items(
      Joi.object({
        endpoint: Joi.string().trim().required(),
        address: Joi.string().trim(),
        value: Joi.string().trim().required(),
        reason: Joi.string().trim().required(),
      })
    ),
    nodejs: Joi.semverRange().valid(),
    aigne: Joi.boolean().optional(),
  }).default({ server: BLOCKLET_LATEST_REQUIREMENT_SERVER, os: '*', cpu: '*', nodejs: '*' }),
  // interfaces: https://github.com/blocklet/blocklet-specification/issues/2
  interfaces: Joi.array()
    .items(interfaceSchema)
    .unique('name')
    .custom((value: any[], helper) => {
      const webItems = value.filter((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);

      if (webItems.length > 1) {
        // @ts-expect-error
        return helper.message(`Only one ${BLOCKLET_INTERFACE_TYPE_WEB} interface can be declared`);
      }
      const wellknownItems = value.filter((x) => x.type === BLOCKLET_INTERFACE_TYPE_WELLKNOWN);

      for (const x of wellknownItems) {
        if (!x.prefix.startsWith(WELLKNOWN_PATH_PREFIX)) {
          // @ts-expect-error
          return helper.message(`Wellknown path prefix must start with: ${WELLKNOWN_PATH_PREFIX}`);
        }
      }
      return value;
    })
    .default([]),
  // environments
  environments: Joi.array()
    .items(environmentSchema)
    .default([])
    .optional()
    .custom((data, helper: CustomHelpers<any>) => {
      if (data && data.length) {
        const duplicates = data.filter((x, index) => data.findIndex((y) => y.name === x.name) !== index);
        if (duplicates.length) {
          // @ts-expect-error
          return helper.message(`find duplicate environment names ${duplicates.map((x) => x.name).join(', ')}`);
        }
      }
      return data;
    }),
  // scripts & hooks
  scripts: scriptsSchema,
  // capabilities
  capabilities: Joi.object({
    clusterMode: Joi.boolean(),
    didSpace: Joi.string()
      .valid(...Object.values(BLOCKLET_APP_SPACE_REQUIREMENT))
      .optional(),
    navigation: Joi.boolean().default(true), // Should blocklet join navigation auto-merge process
    serverless: Joi.boolean().optional(), // Can the blocklet be installed on serverless
    component: Joi.boolean(), // Can blocklet become a component and be composed by other blocklets
    sitemap: Joi.boolean().optional(), // Does this blocklet supports composable sitemap
    mcp: Joi.boolean().optional(), // Does this blocklet supports mcp server sitemap
    singleton: Joi.boolean().optional(), // Does this blocklet supports only single instance, if true, the blocklet cannot be updated or restarted using blue-green deployment
  }).default({}),
  // Other contents to be included in the bundle
  files: Joi.array().items(Joi.string().trim()).optional(),
  resource: Joi.object({
    exportApi: Joi.string().trim(),
    bundles: Joi.array().items(resourceBundleSchema),
    types: Joi.array().items(resourceTypeSchema).max(10),
  }),
  // TODO: this field should be refactored in future version
  engine: Joi.alternatives().try(engineSchema, Joi.array().items(engineSchema)).optional(),
  // NOTE: following fields are appended by registry or bundling process
  screenshots: Joi.array().items(Joi.string().min(1)).optional().default([]),
  videos: Joi.array()
    .items(
      Joi.string()
        // eslint-disable-next-line no-useless-escape
        .pattern(/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[\w\-/?&=]+/)
        .message('Each video URL must be a valid YouTube or Vimeo link')
    )
    .max(3)
    .optional(),
  logoUrl: Joi.string().optional().allow(''),
  dist: distSchema.optional(),
  stats: statsSchema.optional(),
  htmlAst: Joi.any().optional(),
  // deprecated
  path: Joi.string().optional(),
  signatures: Joi.array().items(signatureSchema).optional(),
  lastPublishedAt: Joi.string().isoDate().optional().allow(null),
  // blocklet component support
  components: componentsSchema(),
  // navigation & theme
  navigation: navigationSchema,
  theme: themeSchema,
  copyright: Joi.object({
    owner: Joi.string().min(1),
    year: Joi.alternatives().try(Joi.string(), Joi.number()),
  }),

  // NOTE: following fields only exist in blocklet server and cannot be set manually
  bundleName: Joi.string(),
  bundleDid: Joi.DID().trim(),
  storeId: Joi.string(),

  // open events (within the app) supported by this blocklet
  events: eventsSchema.optional(),
};

const blockletMetaSchema = Joi.object(blockletMetaProps).options({ stripUnknown: true, noDefaults: false }).meta({
  className: 'TBlockletMeta',
  unknownType: 'any',
});

const createBlockletSchema = (
  baseDir: string,
  {
    ensureFiles = false,
    ensureDist = false,
    ensureComponentStore = true,
    ensureName = false,
    skipValidateDidName = false,
    ...schemaOptions
  }: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    ensureName?: boolean; // blocklet name must be exist. used in blocklet-server
    skipValidateDidName?: boolean; // if blocklet name is did format, will not validate did type. used in blocklet-server
  } = {}
): JOI.ObjectSchema => {
  if (!baseDir || !fs.existsSync(baseDir)) {
    // eslint-disable-next-line no-param-reassign
    ensureFiles = false;
  }

  return Joi.object({
    ...blockletMetaProps,
    owner: Joi.object({
      avatar: Joi.string().optional(),
      did: Joi.DID().trim().required(),
      fullName: Joi.string().trim().required(),
      email: Joi.string().optional().allow(null).empty('').default(''),
    }).optional(),
    logo: ensureFiles ? Joi.file().trim().exists({ baseDir }).optional() : Joi.string().trim().optional(),
    // Other contents to be included in the bundle
    files: Joi.array()
      .items(
        ensureFiles
          ? // eslint-disable-next-line
            Joi.file().exists({ baseDir, canSkip: (dir, name) => [BLOCKLET_ENTRY_FILE, BLOCKLET_BUNDLE_FILE].includes(name) || isGlob(name) }) // prettier-ignore
          : Joi.string().trim()
      )
      .optional(),
    dist: ensureDist ? distSchema.required() : distSchema.optional(),
    components: componentsSchema({ checkStore: ensureComponentStore }),
    name: ensureName ? Joi.string().optional() : Joi.string().required(),
    // only using docker
    egress: Joi.boolean().optional().default(true),
    docker: dockerSchema,
  })
    .options({ stripUnknown: true, noDefaults: false, ...schemaOptions })
    .rename('children', 'components')
    .custom((data, helper: CustomHelpers<any>) => {
      const { did, name, docker } = data;
      if (docker) {
        const { image, dockerfile, network } = docker;
        if (image && dockerfile) {
          // @ts-ignore
          return helper.message('Image and dockerfile cannot be set at the same time');
        }
        if (network) {
          // @ts-ignore
          return helper.message('ExportPorts and network cannot be set at the same time');
        }
        if (dockerfile) {
          if (!data.files) {
            data.files = [];
          }
          data.files.push(dockerfile);
        }
      }
      let cacheError;
      if (isValid(did)) {
        try {
          validateNewDid(did);
          return data;
        } catch (e) {
          cacheError = e;
        }
      }

      /* ------------- Backward compatibility: legacy logic derives a DID from the blocklet name ------------- */
      // At this point, name must be present
      if (name) {
        validateName(name, { checkDid: !skipValidateDidName });
        const expectDid = toBlockletDid(name);
        if (expectDid !== did) {
          // @ts-ignore
          return helper.message(`The did of name "${name}" should be "${expectDid}"`);
        }
        return data;
        /* ------------------------------------------------------ */
      }
      if (cacheError) {
        return helper.message(cacheError.message);
      }
      return data;
    });
};

export {
  blockletMetaSchema,
  blockletNameSchema,
  componentSchema,
  createBlockletSchema,
  descriptionSchema,
  distSchema,
  endpointSchema,
  engineSchema,
  environmentSchema,
  environmentNameSchema,
  interfaceSchema,
  logoSchema,
  mountPointSchema,
  updateMountPointSchema,
  navigationItemSchema,
  navigationSchema,
  personSchema,
  scriptsSchema,
  serviceSchema,
  signatureSchema,
  themeSchema,
  titleSchema,
  statsSchema,
  cacheableSchema,
  authConfigSchema,
  resourceBundleSchema,
  installBlockletTitleSchema,
  installBlockletDescriptionSchema,
  eventsSchema,
  Joi,
};

export default {
  blockletNameSchema,
  componentSchema,
  endpointSchema,
  serviceSchema,
  createBlockletSchema,
  interfaceSchema,
  environmentSchema,
  environmentNameSchema,
  scriptsSchema,
  personSchema,
  distSchema,
  titleSchema,
  descriptionSchema,
  logoSchema,
  navigationSchema,
  themeSchema,
  mountPointSchema,
  updateMountPointSchema,
  authConfigSchema,
  resourceBundleSchema,
  installBlockletTitleSchema,
  installBlockletDescriptionSchema,
  eventsSchema,
  Joi,
};
