import {inject} from '@loopback/core';
import {Esv7DataSource} from '../datasources';
import {Category, CategoryRelations} from '../models';
import {BaseRepository} from './base.repository';

export class CategoryRepository extends BaseRepository<
  Category,
  typeof Category.prototype.id,
  CategoryRelations
> {
  constructor(@inject('datasources.esv7') dataSource: Esv7DataSource) {
    super(Category, dataSource);
  }
}
