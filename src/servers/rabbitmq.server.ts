import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {connect, Connection} from 'amqplib';
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

    return undefined;
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
