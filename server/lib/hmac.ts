import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

/**
 * Verify Shopify webhook HMAC signature
 * @param body - Raw request body as string or Buffer
 * @param hmacHeader - X-Shopify-Hmac-Sha256 header value
 * @param secret - Optional API secret (defaults to config.shopify.apiSecret)
 * @returns true if signature is valid
 */
export function verifyShopifyHmac(body: string | Buffer, hmacHeader: string, secret?: string): boolean {
  try {
    const apiSecret = secret || config.shopify.apiSecret;
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
    
    const computedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(bodyBuffer)
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
 * @param query - Query parameters (hmac will be extracted)
 * @param signature - Optional separate signature (if not in query)
 * @param secret - Optional secret (defaults to config.shopify.apiSecret)
 */
export function verifyShopifyRequest(
  query: Record<string, string>,
  signature?: string,
  secret?: string
): boolean {
  const hmac = signature || query.hmac;
  const params = { ...query };
  delete params.hmac;
  
  if (!hmac) {
    return false;
  }

  const apiSecret = secret || config.shopify.apiSecret;

  // Sort and encode parameters
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(computedHmac)
  );
}

// Alias exports for compatibility
export const verifyWebhookHmac = verifyShopifyHmac;
export const verifyOAuthRequest = verifyShopifyRequest;
