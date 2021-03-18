import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CastMemberRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class CastMemberSyncService {
  constructor(
    @repository(CastMemberRepository)
    private castMemberRepository: CastMemberRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.cast_member.*',
    queue: 'micro-catalog/sync-videos/cast_member',
  })
  async handler({data, message}: {data: any; message: Message}) {
    const action = message.fields.routingKey.split('.')[2];
    switch (action) {
      case 'created':
        await this.castMemberRepository.create(data);
        break;
      case 'updated':
        await this.castMemberRepository.updateById(data.id, data);
        break;
      case 'deleted':
        await this.castMemberRepository.deleteById(data.id);
        break;
    }
  }
}
