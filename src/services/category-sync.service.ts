import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';
@bind({scope: BindingScope.SINGLETON})
export class CategorySyncService extends BaseModelSyncService {
  constructor(
    @repository(CategoryRepository)
    private repo: CategoryRepository,
  ) {
    super();
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.*',
    queue: 'micro-catalog/sync-videos/category',
  })
  async handler({data, message}: {data: any; message: Message}) {
    await this.sync({
      repo: this.repo,
      data,
      message,
    });
  }
}