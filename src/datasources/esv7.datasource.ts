import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Client} from 'es7';

const config = {
  name: 'esv7',
  connector: 'esv6',
  index: 'catalog',
  version: 7,
  // debug: process.env.APP_ENV === 'dev',
  defaultSize: 50,
  configuration: {
    node: process.env.ELASTIC_SEARCH_HOST,
    requestTimeout: process.env.ELASTIC_SEARCH_REQUEST_TIMEOUT,
    pingTimeout: process.env.ELASTIC_SEARCH_PING_TIMEOUT,
  },
  indexSettings: {
    number_of_shards: 1,
    number_of_replicas: 1,
    max_ngram_diff: 7,
    analysis: {
      analyzer: {
        ngram_token_analyzer: {
          type: 'custom',
          stopwords: '_none_', //Default _english_
          //When not customized, the filter removes the following English stop words by default:
          //a, an, and, are, as, at, be, but, by, for, if, in, into, is, it, no, not, of, on, or, such, that, the, their, then, there, these, they, this, to, was, will, with
          filter: ['lowercase', 'asciifolding', 'no_stop', 'ngram_filter'],
          tokenizer: 'whitespace',
          //When not customized, the filter removes the following English stop words by default
        },
      },
      filter: {
        no_stop: {
          type: 'stop',
          stopwords: '_none_',
        },
        ngram_filter: {
          type: 'nGram',
          min_gram: '2',
          max_gram: '9',
          //"Loopback"
          //Tokens gerados [ L, Lo, o, oo, p, pb, b, ba, a, ac, c, ck, k ]
        },
      },
    },
  },
  mappingProperties: {
    docType: {
      type: 'keyword',
    },
    id: {
      type: 'keyword',
    },
    name: {
      type: 'text', //analisado
      analyzer: 'ngram_token_analyzer',
      search_analyzer: 'ngram_token_analyzer',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256,
        },
      },
    },
    description: {
      type: 'text', //analisado
      analyzer: 'ngram_token_analyzer',
      search_analyzer: 'ngram_token_analyzer',
    },
    type: {
      type: 'byte',
    },
    is_active: {
      type: 'boolean',
    },
    created_at: {
      type: 'date',
    },
    updated_at: {
      type: 'date',
    },
    categories: {
      type: 'nested',
      properties: {
        id: {type: 'keyword'},
        name: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        is_active: {type: 'boolean'},
      },
    },
  },
};
// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class Esv7DataSource
  extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'esv7';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.esv7', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }

  public async deleteAllDocuments() {
    const index = (this as any).adapter.settings.index;

    const client: Client = (this as any).adapter.db;
    await client.delete_by_query({
      index,
      body: {
        query: {
          match_all: {},
        },
      },
    });
  }
}
