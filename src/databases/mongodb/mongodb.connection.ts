import mongoose, { ConnectOptions, Connection, createConnection } from "mongoose";
import { env } from "../../config/env.config";


class MongoConnection {

  private connect!: Connection;

  constructor() {
    this.initiateMongoConnection();
  }

  initiateMongoConnection() {
    if (!this.connect) {
      const options: ConnectOptions = {};
      this.connect = createConnection(this.getConnectionUri(), options);
      this.registerConnectionEvent();
      mongoose.set('debug', true);
    }
  }

  getConnectionUri() {
    return env.MONGODB_URI;
  }

  registerConnectionEvent() {
    this.connect.on('error', () => {
      console.log('error in mongo')
    })
    this.connect.once('open', () => {
      console.log('MongoDB connected successfully!,\nconnected to ', this.getConnectionUri());
    })
  }

  getConnection(): Connection {
    return this.connect;
  }

}

export const mongoConnection = new MongoConnection();