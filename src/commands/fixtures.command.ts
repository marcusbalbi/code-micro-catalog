import {default as chalk} from 'chalk';
import {MicroCatalogApplication} from '..';
import * as config from '../../config';
import fixtures from '../fixtures';
import {DefaultCrudRepository} from '@loopback/repository';
import {ValidatorService} from '../services/validator.service';
import {Esv7DataSource} from '../datasources';
export class FixturesCommand {
  static command = 'fixtures';
  static description = 'Fixtures Data in ElasticSearch';
  private app: MicroCatalogApplication;
  async run() {
    await this.bootApp();
    console.log(chalk.green('Delete all documents'));
    const datasource: Esv7DataSource = this.app.getSync('datasources.esv7');
    await datasource.deleteAllDocuments();

    const validator = this.app.getSync<ValidatorService>(
      'services.ValidatorService',
    );

    for (const fixture of fixtures) {
      const repository = this.getRepository<DefaultCrudRepository<any, any>>(
        fixture.model,
      );
      await validator.validate({
        data: fixture.fields,
        entityClass: repository.entityClass,
      });
      await repository.create(fixture.fields);
    }

    console.log(chalk.green('Documents Generated'));
  }

  private async bootApp() {
    this.app = new MicroCatalogApplication(config);
    await this.app.boot();
  }

  private getRepository<T>(modelName: string): T {
    return this.app.getSync(`repositories.${modelName}Repository`);
  }
}
