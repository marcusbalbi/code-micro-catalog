import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository, GenreRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@bind({scope: BindingScope.SINGLETON})
export class GenreSyncService extends BaseModelSyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepo: CategoryRepository,
    @repository(GenreRepository)
    private repo: GenreRepository,
    @service(ValidatorService)
    private validator: ValidatorService,
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.*',
    queue: 'micro-catalog/sync-videos/genre',
  })
  async handler({data, message}: {data: any; message: Message}) {
    await this.sync({
      repo: this.repo,
      data,
      message,
    });
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre_categories.*',
    queue: 'micro-catalog/sync-videos/genre_categories',
  })
  async handlerCategories({data, message}: {data: any; message: Message}) {
    await this.syncRelations({
      id: data.id,
      relationIds: data.relation_ids,
      repoRelation: this.categoryRepo,
      message,
    });
  }
}
