import Joi, { LanguageMessages } from 'joi';
import { allowDockerArgs } from './docker-args';
import { dockerArgsToCamelCase, dockerCamelCaseToDash } from './docker-args-to-camel-case';
import { dockerArgsValidator } from './docker-args-validator';
import { dockerCmdValidator } from './docker-cmd-validator';

// 计算最终允许的 Docker 参数键, 不包含 env， 转换为驼峰
const allowedDockerArgKeys = Array.from(new Set(Object.keys(allowDockerArgs).map(dockerArgsToCamelCase)));

// 定义允许多个值的参数
export const multiValueArgs = ['publish', 'volume'];

// 定义 Docker 主体的 Joi 验证架构
export const dockerSchema = Joi.object({
  workdir: Joi.string().trim().optional(),
  image: Joi.string()
    .trim()
    .regex(/^[^\s]+$/)
    .optional(),
  shell: Joi.string().trim().optional(),
  // network: Joi.string().valid('host', 'bridge', 'none').default('host').optional(),
  volumes: Joi.array().items(Joi.string().trim()).optional(),
  script: Joi.string().trim().optional(),
  installNodeModules: Joi.boolean().optional(),
  skipWrapDockerfile: Joi.boolean().optional(),
  tmpfs: Joi.string().trim().optional(),
  command: Joi.string()
    .allow('')
    .default('')
    .optional()
    .custom((value: string, helpers: Joi.CustomHelpers) => {
      try {
        // 调用自定义校验函数
        dockerCmdValidator(value);
        return value;
      } catch (error) {
        return helpers.error('any.invalid', { message: (error as Error).message });
      }
    }, 'Docker CMD validation'),
  runBaseScript: Joi.boolean().optional(),
  // 动态 Docker 参数
  ...allowedDockerArgKeys.reduce(
    (acc, key) => {
      const validFn = dockerArgsValidator[dockerCamelCaseToDash(key)];
      if (multiValueArgs.includes(key)) {
        acc[key] = Joi.array().items(Joi.string().trim()).optional();

        if (validFn) {
          acc[key] = Joi.array()
            .items(
              Joi.string()
                .trim()
                .custom((value: string, helper: Joi.CustomHelpers) => {
                  const msg = validFn(value);
                  if (msg) {
                    return helper.message(msg as unknown as LanguageMessages);
                  }
                  return value;
                }) // eslint-disable-line @typescript-eslint/comma-dangle
            )
            .optional();
        } else {
          acc[key] = Joi.array().items(Joi.string().trim()).optional();
        }
        return acc;
      }

      if (validFn) {
        acc[key] = Joi.string()
          .trim()
          .custom((value: string, helper: Joi.CustomHelpers) => {
            const msg = validFn(value);
            if (msg) {
              return helper.message(msg as unknown as LanguageMessages);
            }
            return value;
          })
          .optional();
      } else {
        acc[key] = Joi.string().trim().optional();
      }
      return acc;
    },
    {} as Record<string, Joi.AnySchema> // eslint-disable-line @typescript-eslint/comma-dangle
  ),
}).optional();

const validateDockerImage = (dockerImage: string) => {
  const reg =
    /^(?:[a-zA-Z0-9.-]+(?::[0-9]+)?\/)?(?:[a-z0-9]+(?:[._-][a-z0-9]+)*\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(:[a-zA-Z0-9_.-]+)?$/;

  return Joi.string().trim().regex(reg).required().validate(dockerImage);
};

export const parseDockerArgsToSchema = (
  dockerImage: string,
  dockerCommand: string,
  // eslint-disable-next-line @typescript-eslint/comma-dangle
  args: { key: string; value: string }[]
) => {
  const obj: Record<string, string[] | string> = {};
  args.forEach((item) => {
    const key = dockerArgsToCamelCase(item.key);
    if (multiValueArgs.includes(key)) {
      obj[key] = [...(obj[key] || []), item.value];
    } else {
      obj[key] = item.value;
    }
  });
  const { error } = validateDockerImage(dockerImage);
  if (error) {
    return { error, value: obj };
  }
  try {
    dockerCmdValidator(dockerImage);
  } catch (err) {
    return { error: err as Error, value: obj };
  }
  obj.image = dockerImage;
  obj.command = dockerCommand || '';
  return dockerSchema.validate(obj);
};
