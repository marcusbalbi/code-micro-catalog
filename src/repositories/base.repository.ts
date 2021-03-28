import {DefaultCrudRepository, Entity} from '@loopback/repository';
import {Client} from 'es6';
import {pick} from 'lodash';

export class BaseRepository<
  T extends Entity,
  ID,
  Relations extends object = {}
> extends DefaultCrudRepository<T, ID, Relations> {
  async attachRelation(id: ID, relationName: string, data: object[]) {
    const document = {
      index: this.dataSource.settings.index,
      refresh: true,
      body: {
        query: {
          term: {
            _id: id,
          },
        },
        script: {
          source: `
          if ( !ctx._source.containsKey('${relationName}')){
            ctx._source['${relationName}'] = [];
          }
          for(item in params['${relationName}']){
            if (ctx._source['${relationName}'].find( i -> i.id == item.id) == null) {
              ctx._source['${relationName}'].add(item)
            }
          }
        `,
          params: {
            [relationName]: data,
          },
        },
      },
    };
    const db: Client = this.dataSource?.connector?.db;

    await db.update_by_query(document);
  }

  async updateRelation(
    relationName: string,
    data: {id: any; [key: string]: string},
  ) {
    const fields = Object.keys(
      this.modelClass.definition.properties[relationName].jsonSchema.items
        .properties,
    );
    const relation = pick(data, fields);
    const document = {
      index: this.dataSource.settings.index,
      refresh: true,
      body: {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: relationName,
                  query: {
                    exists: {field: relationName},
                  },
                },
              },
              {
                nested: {
                  path: relationName,
                  query: {
                    term: {
                      [`${relationName}.id`]: relation.id,
                    },
                  },
                },
              },
            ],
          },
        },
        script: {
          source: `
          ctx._source['${relationName}'].removeIf(i -> i.id == params['relation']['id']);
          ctx._source['${relationName}'].add(params['relation']);
        `,
          params: {
            relation,
          },
        },
      },
    };
    const db: Client = this.dataSource?.connector?.db;

    await db.update_by_query(document);
  }
}
