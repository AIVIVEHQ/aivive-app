import 'server-only';
import { Creem } from 'creem';

// Use test API in development/test mode
const isTestMode = process.env.NODE_ENV !== 'production' || process.env.CREEM_TEST_MODE === 'true';
const baseURL = isTestMode ? 'https://test-api.creem.io' : 'https://api.creem.io';

export const creem = new Creem();
export const CREEM_API_KEY = process.env.CREEM_API_KEY || '';
export const CREEM_BASE_URL = baseURL;
