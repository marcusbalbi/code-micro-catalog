/* eslint-disable @typescript-eslint/no-floating-promises */
import {Binding, Context, inject, MetadataInspector} from '@loopback/context';
import {Application, CoreBindings, Server} from '@loopback/core';
import {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Message, Options} from 'amqplib';
import {RabbitmqBindings} from '../keys';
import {
  RabbitmqSubscribeMetadata,
  RABBITMQ_SUBSCRIBE_DECORATOR,
} from '../decorators/rabbitmq-subscribe.decorator';

export enum ResponseEnum {
  ACK = 0,
  REQUEUE = 1,
  NACK = 2,
}
export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: {name: string; type: string; options?: Options.AssertExchange}[];
  defaultHandlerError?: ResponseEnum;
}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    public app: Application,
    @inject(RabbitmqBindings.CONFIG)
    private config: RabbitmqConfig,
  ) {
    super(app);
  }

  async start(): Promise<void> {
    console.log('starting rabbitmq', this.config);
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this._conn.createChannel();
    this._channelManager.on('connect', () => {
      this._listening = true;
      console.log('connected with RabbitMq');
    });

    this._channelManager.on('error', (err, {name}) => {
      this._listening = false;
      console.log(`Failed connectig with RabbitMQ - ${name} : ${err.message}`);
    });
    await this.setupExchanges();
    this._channelManager.addSetup(async (channel: ConfirmChannel) => {
      const assertExchange = await channel.assertExchange(
        'dlx.amq.topic',
        'topic',
      );
      const assertQueue = await channel.assertQueue('dlx.sync-videos', {
        deadLetterExchange: 'amq.topic',
        messageTtl: 20000,
      });
      channel.bindQueue(
        assertQueue.queue,
        assertExchange.exchange,
        'model.category.*',
      );
    });
    await this.bindSubscribers();
    return undefined;
  }

  async setupExchanges() {
    try {
      this._channelManager.addSetup(async (channel: ConfirmChannel) => {
        if (!this.config.exchanges) {
          return;
        }
        await Promise.all(
          this.config.exchanges.map((exchange) => {
            channel
              .assertExchange(exchange.name, exchange.type)
              .catch((err) => {
                console.log(err);
              });
          }),
        ).catch((err) => {
          throw err;
        });
      });
    } catch (err) {
      console.log(err);
    }
  }

  private async bindSubscribers() {
    this.getSubscribers().map(async (item) => {
      await this._channelManager.addSetup(async (channel: ConfirmChannel) => {
        const {exchange, routingKey, queue, queueOptions} = item.metadata;
        const assertQueue = await channel.assertQueue(
          queue ?? '',
          queueOptions ?? undefined,
        );
        const routingKeys = Array.isArray(routingKey)
          ? routingKey
          : [routingKey];

        await Promise.all(
          routingKeys.map((x) =>
            channel.bindQueue(assertQueue.queue, exchange, x),
          ),
        );
        await this.consume({
          channel,
          queue: assertQueue.queue,
          method: item.method,
        });
      });
    });
  }

  private async consume({
    channel,
    queue,
    method,
  }: {
    channel: ConfirmChannel;
    queue: string;
    method: Function;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await channel.consume(queue, async (message) => {
      try {
        if (!message) {
          throw new Error('Received null Message');
        }
        const content = message.content;
        if (content) {
          let data;
          try {
            data = JSON.parse(content.toString());
          } catch (err) {
            data = null;
          }
          console.log('message received', queue, message.fields.routingKey);
          const responseType = await method({data, message, channel});
          this.dispatchResponse(channel, message, responseType);
        }
      } catch (err) {
        console.log(err);
        if (!message) {
          return;
        }
        this.dispatchResponse(
          channel,
          message,
          this.config.defaultHandlerError,
        );
      }
    });
  }

  private getSubscribers(): {
    method: Function;
    metadata: RabbitmqSubscribeMetadata;
  }[] {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');

    return bindings
      .map((binding) => {
        const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(
          RABBITMQ_SUBSCRIBE_DECORATOR,
          binding.valueConstructor?.prototype,
        );

        if (!metadata) {
          return [];
        }
        const methods = [];
        for (const methodName in metadata) {
          if (!Object.prototype.hasOwnProperty.call(metadata, methodName)) {
            continue;
          }
          const service = this.getSync(binding.key) as any;

          methods.push({
            method: service[methodName].bind(service),
            metadata: metadata[methodName],
          });
        }
        return methods;
      })
      .reduce((collection: any, item: any) => {
        collection.push(...item);
        return collection;
      }, []);
  }

  private dispatchResponse(
    channel: Channel,
    message: Message,
    responseType?: ResponseEnum,
  ) {
    switch (responseType) {
      case ResponseEnum.REQUEUE: {
        channel.nack(message, false, true);
        break;
      }
      case ResponseEnum.NACK: {
        channel.nack(message, false, false);
        break;
      }
      case ResponseEnum.ACK:
      default: {
        channel.ack(message);
      }
    }
  }

  async stop(): Promise<void> {
    try {
      await this.conn.close();
    } catch (err) {
      console.log(err);
      throw new Error(
        'Failed to close connection with rabbitmq: ' + err.message,
      );
    } finally {
      this._listening = false;
    }
    return undefined;
  }

  get listening(): boolean {
    return this._listening;
  }

  get conn(): AmqpConnectionManager {
    return this._conn;
  }
  get channelManager(): ChannelWrapper {
    return this._channelManager;
  }
}
