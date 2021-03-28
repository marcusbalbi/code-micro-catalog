import {inject} from '@loopback/core';
import {Esv7DataSource} from '../datasources';
import {Genre, GenreRelations} from '../models';
import {BaseRepository} from './base.repository';

export class GenreRepository extends BaseRepository<
  Genre,
  typeof Genre.prototype.id,
  GenreRelations
> {
  constructor(@inject('datasources.esv7') dataSource: Esv7DataSource) {
    super(Genre, dataSource);
  }
}
