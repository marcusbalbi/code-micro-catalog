import {DefaultCrudRepository} from '@loopback/repository';
import {Message} from 'amqplib';
import {pick} from 'lodash';

export interface SyncOptions {
  repo: DefaultCrudRepository<any, any>;
  data: any;
  message: Message;
}

export abstract class BaseModelSyncService {
  protected async sync({repo, data, message}: SyncOptions) {
    const {id} = data || {};
    const action = this.getAction(message);
    const entity = this.createEntity(data, repo);
    switch (action) {
      case 'created':
        await repo.create(entity);
        break;
      case 'updated':
        await repo.updateById(id, entity);
        break;
      case 'deleted':
        await repo.deleteById(id);
        break;
    }
  }

  protected getAction(message: Message) {
    return message.fields.routingKey.split('.')[2];
  }

  protected createEntity(data: any, repo: DefaultCrudRepository<any, any>) {
    return pick(data, Object.keys(repo.entityClass.definition.properties));
  }
}
