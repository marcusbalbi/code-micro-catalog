import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Channel, connect, Connection, ConsumeMessage, Replies} from 'amqplib';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';
export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;
  channel: Channel;
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {
    super();
  }
  async start(): Promise<void> {
    console.log('starting rabbitmq');
    this.conn = await connect({
      hostname: 'rabbitmq',
      username: 'admin',
      password: 'admin',
    });
    this._listening = true;
    this.boot().catch(err => {
      console.log('Falha ao iniciar:' + err.messag);
    });

    return undefined;
  }
  async boot() {
    this.channel = await this.conn.createChannel();
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

    // console.log(result);
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
          await this.categoryRepository.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
          });
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
}
