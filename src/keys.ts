import {CoreBindings} from '@loopback/core';

export namespace RabbitmqBindings {
  export const CONFIG = CoreBindings.APPLICATION_CONFIG.deepProperty(
    'rabbitmq',
  );
}
