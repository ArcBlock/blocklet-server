const Joi = require('joi');

const colorString = Joi.string(); // Accepts rgba, hex, etc.

const paletteColorSchema = Joi.object({
  main: colorString,
  contrastText: colorString.optional(),
  light: colorString.optional(),
  dark: colorString.optional(),
});

const greySchema = Joi.object({
  50: colorString.optional(),
  100: colorString.optional(),
  200: colorString.optional(),
  300: colorString.optional(),
  400: colorString.optional(),
  500: colorString.optional(),
  600: colorString.optional(),
  700: colorString.optional(),
  800: colorString.optional(),
  900: colorString.optional(),
  A100: colorString.optional(),
  A200: colorString.optional(),
  A400: colorString.optional(),
  A700: colorString.optional(),
});

const textSchema = Joi.object({
  primary: colorString.optional(),
  secondary: colorString.optional(),
  disabled: colorString.optional(),
  hint: colorString.optional(),
  contrast: colorString.optional(),
});

const backgroundSchema = Joi.object({
  default: colorString.optional(),
  paper: colorString.optional(),
});

const commonSchema = Joi.object({
  black: colorString.optional(),
  white: colorString.optional(),
});

const actionSchema = Joi.object({
  active: colorString.optional(),
  hover: colorString.optional(),
  hoverOpacity: Joi.number().optional(),
  selected: colorString.optional(),
  selectedOpacity: Joi.number().optional(),
  disabled: colorString.optional(),
  disabledBackground: colorString.optional(),
  disabledOpacity: Joi.number().optional(),
  focus: colorString.optional(),
  focusOpacity: Joi.number().optional(),
  activatedOpacity: Joi.number().optional(),
});

const paletteSchema = Joi.object({
  mode: Joi.string().valid('light', 'dark').optional(),
  primary: paletteColorSchema.optional(),
  secondary: paletteColorSchema.optional(),
  error: paletteColorSchema.optional(),
  warning: paletteColorSchema.optional(),
  info: paletteColorSchema.optional(),
  success: paletteColorSchema.optional(),
  grey: greySchema.optional(),
  text: textSchema.optional(),
  divider: colorString.optional(),
  background: backgroundSchema.optional(),
  common: commonSchema.optional(),
  action: actionSchema.optional(),
  storeSecondary: paletteColorSchema.optional(),
  did: Joi.object({
    primary: colorString.optional(),
    secondary: colorString.optional(),
  }).optional(),
});

const shapeSchema = Joi.object({
  borderRadius: Joi.number().optional(),
});

const typographyVariantSchema = Joi.object({
  fontSize: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  lineHeight: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  fontWeight: Joi.number().optional(),
  textTransform: Joi.string().optional(),
  fontFamily: Joi.string().optional(),
});

const allowedTypographyVariants = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'caption',
  'overline',
  'button',
  'allVariants',
];
const typographySchema = Joi.object({
  fontSize: Joi.number().optional(),
  fontFamily: Joi.string().optional(),
  color: Joi.object({
    main: colorString.optional(),
    gray: colorString.optional(),
  }).optional(),
  ...Object.fromEntries(allowedTypographyVariants.map((v) => [v, typographyVariantSchema.optional()])),
});

const breakpointsSchema = Joi.object({
  values: Joi.object({
    xs: Joi.number().optional(),
    sm: Joi.number().optional(),
    md: Joi.number().optional(),
    lg: Joi.number().optional(),
    xl: Joi.number().optional(),
  }).optional(),
});

const shadowsSchema = Joi.array().items(Joi.string()).min(1).max(25);

const styleOverrideSchema = Joi.object().pattern(Joi.string(), Joi.any());

const componentsSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object({
    styleOverrides: styleOverrideSchema.optional(),
  })
);

const muiThemeSchema = Joi.object({
  palette: paletteSchema.optional(),
  shape: shapeSchema.optional(),
  typography: typographySchema.optional(),
  breakpoints: breakpointsSchema.optional(),
  shadows: shadowsSchema.optional(),
  components: componentsSchema.optional(),
}).options({ allowUnknown: true, stripUnknown: true });

const editorStateSchema = Joi.object({
  colors: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        isLocked: Joi.boolean().required(),
      })
    )
    .optional(),
  typography: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        isLocked: Joi.boolean().required(),
      })
    )
    .optional(),
  styles: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        isLocked: Joi.boolean().required(),
      })
    )
    .optional(),
}).options({ allowUnknown: true, stripUnknown: true });

const conceptSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  mode: Joi.string().valid('light', 'dark').required(),
  prefer: Joi.string().valid('light', 'dark', 'system').required(),
  themeConfig: Joi.object({
    light: muiThemeSchema.required(),
    dark: muiThemeSchema.required(),
    common: muiThemeSchema.required(),
  }).required(),
  editor: editorStateSchema.required(),
}).options({ allowUnknown: true, stripUnknown: true });

// Theme data schema (concepts and currentConceptId)
const themeDataSchema = Joi.object({
  concepts: Joi.array().items(conceptSchema).required(),
  currentConceptId: Joi.string().required(),
}).options({ allowUnknown: true, stripUnknown: true });

// Theme meta schema for storing metadata like locked status
const themeMetaSchema = Joi.object({
  meta: Joi.object({
    locked: Joi.boolean().required(),
  }).required(),
}).options({ allowUnknown: true, stripUnknown: true });

// Top-level blocklet theme schema - either theme data OR meta, not both
const blockletThemeSchema = Joi.alternatives().try(
  // Theme data schema
  themeDataSchema,
  // Meta-only schema
  themeMetaSchema
);

module.exports = {
  muiThemeSchema,
  blockletThemeSchema,
  themeDataSchema,
  themeMetaSchema,
};
