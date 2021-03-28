import {BootMixin} from '@loopback/boot';
import {Application, ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestComponent, RestServer} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {RabbitmqServer} from './servers';
import {
  EntityComponent,
  RestExplorerComponent,
  ValidatorsComponent,
} from './components';
// import {CategoryRepository, GenreRepository} from './repositories';

export class MicroCatalogApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    // Set up the custom sequence
    options.rest.sequence = MySequence;
    this.component(RestComponent);
    this.component(ValidatorsComponent);
    this.component(EntityComponent);
    const restServer = this.getSync<RestServer>('servers.RestServer');
    restServer.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
    this.server(RabbitmqServer);
  }

  async boot() {
    await super.boot();
    // setTimeout(async () => {
    //   const categoryRepo: CategoryRepository = this.getSync(
    //     'repositories.CategoryRepository',
    //   );
    //   const genreRepo: GenreRepository = this.getSync(
    //     'repositories.GenreRepository',
    //   );
    //   const category = await categoryRepo.find({
    //     where: {id: '5bbff04e-f709-4f30-b927-6d9149bbed07'},
    //   });

    //   // await genre.updateCategories(category[0]);
    //   await categoryRepo.updateById(category[0].id, {
    //     ...category[0],
    //     name: 'ABCD1231232131',
    //   });
    //   console.log('updated!');
    // }, 3000);
  }
}
