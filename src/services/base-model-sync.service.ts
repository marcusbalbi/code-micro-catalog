import {DefaultCrudRepository, EntityNotFoundError} from '@loopback/repository';
import {Message} from 'amqplib';
import {pick} from 'lodash';
import {BaseRepository} from '../repositories/base.repository';
import {ValidatorService} from './validator.service';

export interface SyncOptions {
  repo: DefaultCrudRepository<any, any>;
  data: any;
  message: Message;
}

export interface SyncRelationsOptions {
  id: string;
  repo: BaseRepository<any, any>;
  message: Message;
  relationName: string;
  relationIds: string[];
  relationRepo: DefaultCrudRepository<any, any>;
}

export abstract class BaseModelSyncService {
  constructor(public validateService: ValidatorService) {}
  protected async sync({repo, data, message}: SyncOptions) {
    const {id} = data || {};
    const action = this.getAction(message);
    const entity = this.createEntity(data, repo);
    switch (action) {
      case 'created':
        await this.validateService.validate({
          data: entity,
          entityClass: repo.entityClass,
        });
        await repo.create(entity);
        break;
      case 'updated':
        await this.updateOrCreate({repo, id, entity});
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

  protected async updateOrCreate({
    repo,
    id,
    entity,
  }: {
    repo: DefaultCrudRepository<any, any>;
    id: string;
    entity: any;
  }) {
    const exists = await repo.exists(id);
    await this.validateService.validate({
      data: entity,
      entityClass: repo.entityClass,
      ...(exists && {options: {partial: true}}),
    });
    return exists ? repo.updateById(id, entity) : repo.create(entity);
  }

  async syncRelations({
    id,
    relationName,
    relationIds,
    repo,
    relationRepo,
    message,
  }: SyncRelationsOptions) {
    /**
     * {
        "id": "49725b42-64b5-4f91-908e-212b14162b51",
        "relation_ids": ["1231545312"]
        }
     */
    const fieldsRelation = this.extractFieldsRelation(repo, relationName);
    const collection = await relationRepo.find({
      where: {
        or: relationIds.map((relId) => {
          return {
            id: relId,
          };
        }),
      },
      fields: fieldsRelation,
    });
    if (!collection.length) {
      const error = new EntityNotFoundError(
        relationRepo.entityClass,
        relationIds,
      );
      error.name = 'EntityNotFound';
      throw error;
    }
    const action = this.getAction(message);
    if (action === 'attached') {
      await repo.attachRelation(id, relationName, collection);
    }
    // await repo.updateById(id, {[relation]: collection});
  }

  protected extractFieldsRelation(
    repo: DefaultCrudRepository<any, any>,
    relation: string,
  ) {
    return Object.keys(
      repo.modelClass.definition.properties[relation].jsonSchema.items
        .properties,
    ).reduce((obj: any, curr) => {
      obj[curr] = true;
      return obj;
    }, {});
  }
}
