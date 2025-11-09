import { Socket } from 'socket.io';
import { JwtPayload } from 'jsonwebtoken';
import {type UserDocument } from 'src/DB';

export interface ISocketAuth extends Socket {
  credentials: {
    user: UserDocument;
    decoded: JwtPayload;
  };
}

