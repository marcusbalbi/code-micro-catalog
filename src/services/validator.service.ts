import {bind, /* inject, */ BindingScope, inject} from '@loopback/core';
import {getModelSchemaRef} from '@loopback/openapi-v3';
import {Entity, repository} from '@loopback/repository';
import {AjvFactory, RestBindings, validateRequestBody} from '@loopback/rest';
import {CategoryRepository} from '../repositories';

interface ValidateOptions<T> {
  data: any;
  entityClass: Function & {prototype: T};
}

@bind({scope: BindingScope.SINGLETON})
export class ValidatorService {
  constructor(
    @inject(RestBindings.AJV_FACTORY)
    private ajvFactory: AjvFactory,
    @repository(CategoryRepository)
    private repo: CategoryRepository,
  ) {}

  async validate<T extends object>({data, entityClass}: ValidateOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);
    const schemaRef = {
      $ref: modelSchema.$ref,
    };
    await validateRequestBody(
      {value: data, schema: schemaRef},
      {
        required: true,
        content: {},
      },
      modelSchema.definitions,
      {
        ajvFactory: this.ajvFactory,
      },
    );
  }
}
