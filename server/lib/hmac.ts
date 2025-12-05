import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

/**
 * Verify Shopify webhook HMAC signature
 * @param body - Raw request body as Buffer
 * @param hmacHeader - X-Shopify-Hmac-Sha256 header value
 * @returns true if signature is valid
 */
export function verifyShopifyHmac(body: Buffer, hmacHeader: string): boolean {
  try {
    const computedHmac = crypto
      .createHmac('sha256', config.shopify.apiSecret)
      .update(body)
      .digest('base64');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader),
      Buffer.from(computedHmac)
    );
  } catch (error) {
    logger.error({ error }, 'HMAC verification failed');
    return false;
  }
}

/**
 * Verify Shopify OAuth request signature
 */
export function verifyShopifyRequest(query: Record<string, string>): boolean {
  const { hmac, ...params } = query;
  
  if (!hmac) {
    return false;
  }

  // Sort and encode parameters
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', config.shopify.apiSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(computedHmac)
  );
}
