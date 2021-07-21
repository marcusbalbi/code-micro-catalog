import {Filter, FilterBuilder} from '@loopback/repository';
import {clone} from 'lodash';
import {Category} from '../models';

export class CategoryFilterBuilder extends FilterBuilder<Category> {
  dFilter: Filter<Category>;
  constructor(f?: Filter<Category>) {
    super(f);
    this.dFilter = clone(this.defaultFilter().filter);
    return this;
  }

  private defaultFilter() {
    return this.where({
      is_active: true,
    });
  }

  build() {
    return this.impose(this.dFilter).filter;
  }
}
