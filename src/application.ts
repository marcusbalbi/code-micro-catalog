import {BootMixin} from '@loopback/boot';
import {Application, ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestComponent, RestServer} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {RabbitmqServer} from './servers';
import {RestExplorerComponent} from './components';
import {ValidatorService} from './services/validator.service';
import {Category} from './models';

export class MicroCatalogApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    options.rest.sequence = MySequence;
    this.component(RestComponent);
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
    // const validator = this.getSync<ValidatorService>(
    //   'services.ValidatorService',
    // );

    // await validator.validate({
    //   data: {},
    //   entityClass: Category,
    // });
  }
}
