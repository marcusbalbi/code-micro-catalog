import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {Channel, connect, Connection, ConsumeMessage, Replies} from 'amqplib';
export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;
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
    const channel: Channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await channel.assertQueue(
      'micro-catalog/sync-videos',
    );
    const exchange: Replies.AssertExchange = await channel.assertExchange(
      'amq.topic',
      'topic',
    );

    await channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    // const result = channel.publish(
    //   exchange.exchange,
    //   'minha-routing-key',
    //   Buffer.from(JSON.stringify({ola: 'mundo', time: Date.now()})),
    // );

    channel
      .consume(queue.queue, (message: ConsumeMessage | null) => {
        if (!message) {
          return;
        }
        console.log(
          'Message Received!',
          JSON.parse(message.content.toString()),
        );
        const [model, event] = message.fields.routingKey.split('.').slice(1);
        console.log(model, event);
      })
      .catch(err => console.log(err));

    // console.log(result);
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
