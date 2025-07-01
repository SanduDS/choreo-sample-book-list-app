// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.

// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import axios from "axios";
import { clientCredentials } from 'axios-oauth-client';

// Token cache to store the current token and its expiration
interface TokenCache {
  access_token: string;
  expires_at: number;
}

let tokenCache: TokenCache | null = null;

// Get OAuth configuration from window.config or environment
const getOAuthConfig = () => {
  return {
    tokenUrl: window.config?.tokenUrl,
    consumerKey: window.config?.consumerKey,
    consumerSecret: window.config?.consumerSecret,
  };
};

// Function to get a valid access token (either from cache or fetch new one)
const getValidAccessToken = async (): Promise<string> => {
  const now = Date.now();
  
  // Check if we have a cached token that's still valid (with 5-minute buffer)
  if (tokenCache && tokenCache.expires_at > now + 5 * 60 * 1000) {
    return tokenCache.access_token;
  }

  // Get new token using OAuth client credentials flow
  const config = getOAuthConfig();
  
  if (!config.tokenUrl || !config.consumerKey || !config.consumerSecret) {
    throw new Error('OAuth configuration is missing. Please check tokenUrl, consumerKey, and consumerSecret.');
  }

  const getClientCredentials = clientCredentials(
    axios.create(),
    config.tokenUrl,
    config.consumerKey,
    config.consumerSecret
  );

  try {
    const auth = await getClientCredentials('');
    
    // Cache the token with expiration time
    tokenCache = {
      access_token: auth.access_token,
      expires_at: now + (auth.expires_in * 1000) // Convert seconds to milliseconds
    };

    return auth.access_token;
  } catch (error) {
    console.error('Failed to obtain access token:', error);
    throw error;
  }
};

export const getReadingListInstance = async () => {
  const accessToken = await getValidAccessToken();
  
  return axios.create({ 
    baseURL: window.config.choreoApiUrl,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
};
