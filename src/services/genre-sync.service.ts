import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {GenreRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class GenreSyncService {
  constructor(
    @repository(GenreRepository)
    private genreRepository: GenreRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    routingKey: 'model.genre.*',
    queue: 'micro-catalog/sync-videos/genre',
  })
  async handler({data, message}: {data: any; message: Message}) {
    const action = message.fields.routingKey.split('.')[2];
    switch (action) {
      case 'created':
        await this.genreRepository.create(data);
        break;
      case 'updated':
        await this.genreRepository.updateById(data.id, data);
        break;
      case 'deleted':
        await this.genreRepository.deleteById(data.id);
        break;
    }
  }
}
