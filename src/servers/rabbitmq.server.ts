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
    const exchange: Replies.AssertExchange = await channel.assertExchange(
      'amq.direct',
      'direct',
    );
    const queue: Replies.AssertQueue = await channel.assertQueue('first-queue');

    await channel.bindQueue(
      queue.queue,
      exchange.exchange,
      'minha-routing-key',
    );

    const result = channel.publish(
      exchange.exchange,
      'minha-routing-key',
      Buffer.from(JSON.stringify({ola: 'mundo', time: Date.now()})),
    );

    channel
      .consume('first-queue', (payload: ConsumeMessage | null) => {
        console.log('Message Received!', payload?.content.toString());
        console.log(payload);
      })
      .catch(err => console.log(err));

    console.log(result);
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
