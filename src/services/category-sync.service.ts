import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';

const QUEUE_NAME = 'micro-catalog/sync-videos/category';
@bind({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.category.*',
    queue: 'micro-catalog/sync-videos/category',
  })
  async handler({data, message}: {data: any; message: Message}) {
    const action = message.fields.routingKey.split('.')[2];
    switch (action) {
      case 'created':
        await this.categoryRepository.create(data);
        break;
      case 'updated':
        await this.categoryRepository.updateById(data.id, data);
        break;
      case 'deleted':
        await this.categoryRepository.deleteById(data.id);
        break;
    }
  }
}
