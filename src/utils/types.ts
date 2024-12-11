import {
  AuthenticationClient,
  DirectusClient,
  RestClient,
} from '@directus/sdk';

export type DirectusUtilitiesClient = DirectusClient<any> &
  AuthenticationClient<any> &
  RestClient<any>;
