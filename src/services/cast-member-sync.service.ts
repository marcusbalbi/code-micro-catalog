import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CastMemberRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';

@bind({scope: BindingScope.SINGLETON})
export class CastMemberSyncService extends BaseModelSyncService {
  constructor(
    @repository(CastMemberRepository)
    private repo: CastMemberRepository,
  ) {
    super();
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast_member.*',
    queue: 'micro-catalog/sync-videos/cast_member',
  })
  async handler({data, message}: {data: any; message: Message}) {
    await this.sync({
      repo: this.repo,
      data,
      message,
    });
  }
}
