import '@shopify/shopify-api/adapters/node';
import {
  shopifyApi,
  LATEST_API_VERSION,
  Session,
} from '@shopify/shopify-api';
import { config } from '../config/env';

export const shopify = shopifyApi({
  apiKey: config.shopifyApiKey,
  apiSecretKey: config.shopifyApiSecret,
  scopes: config.shopifyScopes.split(','),
  hostName: new URL(config.shopifyAppUrl).hostname,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

export { Session };
