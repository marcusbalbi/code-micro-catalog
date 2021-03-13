import {Context, inject} from '@loopback/context';
import {Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager';
import {Channel, ConsumeMessage, Replies} from 'amqplib';
import {RabbitmqBindings} from '../keys';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
}
export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;
  constructor(
    @inject(RabbitmqBindings.CONFIG)
    private config: RabbitmqConfig,
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {
    super();
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

    return undefined;
  }
  async boot() {
    /*this.channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await this.channel.assertQueue(
      'micro-catalog/sync-videos',
    );
    const exchange: Replies.AssertExchange = await this.channel.assertExchange(
      'amq.topic',
      'topic',
    );

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    this.channel
      .consume(queue.queue, (message: ConsumeMessage | null) => {
        if (!message) {
          return;
        }
        const data = JSON.parse(message.content.toString());
        const [model, event] = message.fields.routingKey.split('.').slice(1);
        this.sync({
          model,
          event,
          data,
        })
          .then(() => this.channel.ack(message))
          .catch(err => this.channel.reject(message, false));
      })
      .catch(err => console.log(err));

    // console.log(result);*/
  }

  async sync({
    model,
    event,
    data,
  }: {
    model: string;
    event: string;
    data: Category;
  }) {
    /**
     * {
"id": 1,
"name": "BBB",
"description": "Teste rabbit"
}
     */
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepository.create(data);
          break;
        case 'updated':
          await this.categoryRepository.updateById(data.id, data);
          break;
        case 'deleted':
          await this.categoryRepository.deleteById(data.id);
          break;
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
}
