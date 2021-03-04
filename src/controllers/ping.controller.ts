import {Request, RestBindings, get, ResponseObject} from '@loopback/rest';
import {inject} from '@loopback/context';
import {CategoryRepository} from '../repositories';
import {repository} from '@loopback/repository';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

/**
 * OpenAPI response for ping()
 */
const PONG_RESPONSE: ResponseObject = {
  description: 'Pong Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PongResponse',
        properties: {
          message: {
            type: 'string',
            default: 'ponga',
          },
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @repository(CategoryRepository) private categoryRep: CategoryRepository,
  ) {}
  // Map to `GET /ping`
  @get('/ping', {
    responses: {
      '200': PING_RESPONSE,
    },
  })
  async ping() {
    // Reply with a greeting, the current time, the url, and request headers
    console.log(await this.categoryRep.count().catch(err => console.log(err)));
    return {
      greeting: 'Hello from LoopBack',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }
  @get('/pong', {
    parameters: [
      {
        in: 'query',
        name: 'type',
        description: 'Type of pong',
        required: true,
      },
    ],
    responses: {
      '200': PONG_RESPONSE,
    },
  })
  pong(): object {
    console.log(this.req.query);
    return {
      message: 'PONG!',
    };
  }

  @get('/categories')
  async index() {
    try {
      await this.categoryRep.create({
        id: '1',
        name: 'Teste 1',
        description: 'TESTE DE DESCRICAO',
      });
    } catch (err) {
      return err;
    }
    return this.categoryRep.find();
  }
}
