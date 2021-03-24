import {bind, /* inject, */ BindingScope, inject} from '@loopback/core';
import {getModelSchemaRef} from '@loopback/openapi-v3';
import {Entity, model, repository} from '@loopback/repository';
import {AjvFactory, RestBindings, validateRequestBody} from '@loopback/rest';
import {CategoryRepository} from '../repositories';

interface ValidateOptions<T> {
  data: any;
  entityClass: Function & {prototype: T};
}

@bind({scope: BindingScope.SINGLETON})
export class ValidatorService {
  cache = new Map();
  constructor(
    @inject(RestBindings.AJV_FACTORY)
    private ajvFactory: AjvFactory,
    @repository(CategoryRepository)
    private repo: CategoryRepository,
  ) {}

  async validate<T extends object>({data, entityClass}: ValidateOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);
    if (!modelSchema) {
      const error = new Error('the parameter entityClass is not an Entity');
      error.name = 'NotEntityClass';
      throw error;
    }
    const schemaName = Object.keys(modelSchema.definitions)[0];
    if (!this.cache.has(schemaName)) {
      this.cache.set(schemaName, modelSchema.definitions[schemaName]);
    }

    const glogalSchemas = Array.from(this.cache).reduce(
      (obj: any, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {},
    );

    const schemaRef = {
      $ref: modelSchema.$ref,
    };
    await validateRequestBody(
      {value: data, schema: schemaRef},
      {
        required: true,
        content: {},
      },
      glogalSchemas,
      {
        ajvFactory: this.ajvFactory,
      },
    );
  }
}
