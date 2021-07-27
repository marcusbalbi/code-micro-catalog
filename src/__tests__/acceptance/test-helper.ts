import {MicroCatalogApplication} from '../..';
import {givenHttpServerConfig, Client} from '@loopback/testlab';
import config from '../../../config';
import supertest from 'supertest';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    port: 9000,
  });

  const app = new MicroCatalogApplication({
    ...config,
    rest: restConfig,
  });

  await app.boot();
  await app.start();

  const client = supertest('http://127.0.0.1:9000');

  return {app, client};
}

export interface AppWithClient {
  app: MicroCatalogApplication;
  client: Client;
}
