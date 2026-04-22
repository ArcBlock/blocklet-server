import { useCallback, useMemo, useState } from 'react';
import { useMount } from 'ahooks';
import { joinURL } from 'ufo';

const CACHE_KEY = 'ai-kit-model-data';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_VERSION = '1.0.0';
const LITELLM_API_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

export const SUPPORTED_PROVIDERS = new Set([
  'openai',
  'anthropic',
  'bedrock',
  'deepseek',
  'google',
  'ollama',
  'openrouter',
  'xai',
]);

export const getAllProviders = (node) => {
  return [
    {
      provider: 'aigneHub',
      name: 'AIGNE Hub',
      baseURL: 'https://hub.aigne.io',
      logo: node?.imgPrefix ? joinURL(node.imgPrefix, '/aigne-hub.jpg') : '/aigne-hub.jpg',
      documentation: 'https://hub.aigne.io/docs',
      models: [],
    },
  ];
  // models: [AUTO_MODEL, ...modelOptions.map((item) => ({ ...item, name: `${item.provider}/${item.name}` }))],
};

const TIME_PATTERN = /\d{4}-\d{2}-\d{2}/;
const TEST_PATTERN = /^ft:|^test-|^dev-|^beta-|^alpha-/i;
// supported modes
const SUPPORTED_MODES = new Set(['chat', 'image_generation', 'embedding']);
const shouldFilterModel = (modelName, options) => {
  // filter models with time pattern
  if (TIME_PATTERN.test(modelName)) {
    return true;
  }

  // filter test models
  if (TEST_PATTERN.test(modelName)) {
    return true;
  }

  // filter unsupported providers
  if (!SUPPORTED_PROVIDERS.has(options.litellm_provider)) {
    return true;
  }

  // filter unsupported modes
  if (options.mode && !SUPPORTED_MODES.has(options.mode)) {
    return true;
  }

  return false;
};

const formatCostValue = (value) => {
  if (value === undefined || value === null) return undefined;

  if (value === 0) return 0;

  if (value >= 0.01) {
    return Math.round(value * 100) / 100;
  }

  const str = value.toString();
  if (str.includes('e')) {
    const num = parseFloat(str);
    return parseFloat(num.toPrecision(6));
  }
  const decimalPart = str.split('.')[1];
  if (decimalPart) {
    let firstNonZeroIndex = -1;
    for (let i = 0; i < decimalPart.length; i++) {
      if (decimalPart[i] !== '0') {
        firstNonZeroIndex = i;
        break;
      }
    }
    if (firstNonZeroIndex >= 0) {
      const precision = firstNonZeroIndex + 5;
      return parseFloat(value.toFixed(precision));
    }
  }
  return value;
};

const processModelName = (modelName) => {
  const parts = modelName.split('/');

  let processedName = modelName;
  let displayName = modelName;

  if (parts && parts.length > 1 && SUPPORTED_PROVIDERS.has(parts[0])) {
    processedName = parts.slice(1).join('/');
    displayName = processedName;
  }

  const finalDisplayName =
    displayName
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) || displayName;

  if (finalDisplayName.toLowerCase().includes('gpt')) {
    return {
      processedName,
      displayName: finalDisplayName.replace(/gpt/gi, 'GPT'),
    };
  }

  return {
    processedName,
    displayName: finalDisplayName,
  };
};

export function useModelData() {
  const [modelOptions, setModelOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedData = JSON.parse(cached);

      if (parsedData.version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      if (Date.now() > parsedData.expiresAt) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedData;
    } catch (err) {
      console.error('Failed to parse cached model data:', err);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  const cacheData = useCallback((data, totalModels) => {
    try {
      const cachedData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
        totalModels,
        filteredModels: data.length,
        version: CACHE_VERSION,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
    } catch (err) {
      console.error('Failed to cache model data:', err);
    }
  }, []);

  const filterModelData = useCallback((data) => {
    const filtered = [];

    Object.entries(data).forEach(([modelName, options]) => {
      if (shouldFilterModel(modelName, options)) {
        return;
      }

      const { processedName, displayName } = processModelName(modelName);

      filtered.push({
        name: processedName,
        displayName,
        provider: options.litellm_provider,
        inputCost: formatCostValue(options.input_cost_per_token),
        outputCost: formatCostValue(options.output_cost_per_token),
        maxTokens: options.max_tokens || options.max_input_tokens,
        supportsVision: options.supports_vision,
        supportsFunctionCalling: options.supports_function_calling,
      });
    });

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const fetchModelData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cachedData = getCachedData();
      if (cachedData) {
        setModelOptions(cachedData.data);
        setLoading(false);
        return;
      }

      const response = await fetch(LITELLM_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      const totalModels = Object.keys(rawData).length;

      const filteredOptions = filterModelData(rawData);

      cacheData(filteredOptions, totalModels);

      setModelOptions(filteredOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch model data';
      setError(errorMessage);
      console.error('Failed to fetch model data:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheData, filterModelData, getCachedData]);

  const searchModels = useCallback(
    (query, limit = 50) => {
      if (!query.trim()) return [];

      const lowerQuery = query.toLowerCase();
      const matches = modelOptions.filter(
        (option) =>
          option.name.toLowerCase().includes(lowerQuery) || option.displayName.toLowerCase().includes(lowerQuery)
      );

      return matches.slice(0, limit);
    },
    [modelOptions]
  );

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const cacheStatus = useMemo(() => {
    const cached = getCachedData();
    return {
      hasCached: !!cached,
      cacheAge: cached ? Date.now() - cached.timestamp : 0,
      expiresIn: cached ? cached.expiresAt - Date.now() : 0,
    };
  }, [getCachedData]);

  useMount(() => {
    fetchModelData();
  });

  return {
    modelOptions,
    loading,
    error,
    fetchModelData,
    searchModels,
    clearCache,
    cacheStatus,
  };
}
