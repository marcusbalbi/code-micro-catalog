import {getJsonSchema} from '@loopback/openapi-v3';
import {
  AnyObject,
  Filter,
  FilterBuilder,
  JsonSchema,
  Model,
  Where,
  WhereBuilder,
} from '@loopback/repository';
import {clone} from 'lodash';

export abstract class DefaultFilter<
  MT extends object = AnyObject
> extends FilterBuilder<MT> {
  dFilter: Filter<MT> | null;
  constructor(f?: Filter<MT>) {
    super(f);
    const dFilter = this.defaultFilter();
    this.dFilter = dFilter ? clone(dFilter.filter) : null;
    this.filter = {};
  }

  protected defaultFilter(): DefaultFilter<MT> | void {}

  isActive(modelCtor: typeof Model) {
    this.filter.where = new WhereBuilder<{is_active: boolean}>(
      this.filter.where,
    )
      .and({is_active: true})
      .build() as Where<MT>;
    this.isActiveRelations(modelCtor);
    return this;
  }

  isActiveRelations(modelCtor: typeof Model) {
    const relations: string[] = Object.keys(modelCtor.definition.relations);

    if (!relations.length) {
      return this;
    }
    const schema = getJsonSchema(modelCtor);

    const relationsFiltered = relations.filter((r) => {
      const jsonSchema = schema.properties?.[r] as JsonSchema;
      if (
        !jsonSchema ||
        (jsonSchema.type !== 'array' && jsonSchema.type !== 'object')
      ) {
        return false;
      }

      return Object.keys(
        (jsonSchema.items as any).properties || jsonSchema.properties,
      ).includes('is_active');
    });

    const whereStr = JSON.stringify(this.filter.where);

    // (categories.*|relation.*)
    const regex = new RegExp(
      `(${relationsFiltered.map((r) => `${r}.*`).join('|')})`,
      'g',
    );

    const matches = whereStr.match(regex);

    if (!matches) {
      return this;
    }

    const fields = matches.map((m) => {
      const relation = m.split('.')[0];
      return {
        [`${relation}.is_active`]: true,
      };
    });

    this.filter.where = new WhereBuilder<{is_active: boolean}>(
      this.filter.where,
    )
      .and(fields)
      .build() as Where<MT>;
    return this;
  }

  build() {
    return this.dFilter ? this.impose(this.dFilter).filter : this.filter;
  }
}
