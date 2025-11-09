import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Auth, RoleEnum, TokenEnum, User } from 'src/common';
import { roleName } from 'src/common/decorators/roles.decorator';
import { AuthenticationGuard } from 'src/common/guards/authentication/authentication.guard';
import { type ISocketAuth } from 'src/common/interfaces/socket';
import { TokenService } from 'src/common/services/token.service';
import { getSocketAuth } from 'src/common/utils/socket';
import { connectedSockets, type UserDocument } from 'src/DB';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  //   namespace: 'public',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly tokenService: TokenService) {}

  afterInit(server: Server) {
    console.log(`Realtime gateway starred 🚀🚀`);
  }

  async handleConnection(client: ISocketAuth) {
    try {
      console.log(client);
      const authorization = getSocketAuth(client);
      const { user, decoded } = await this.tokenService.decodedToken({
        authorization,
        tokenType: TokenEnum.access,
      });
      const userTapes = connectedSockets.get(user._id.toString()) || [];
      console.log({ userTapes });

      userTapes.push(client.id);

      connectedSockets.set(user._id.toString(), userTapes);
      client.credentials = { user, decoded };
    } catch (error) {
      client.emit('exception', error.message || 'something went wrong');
    }
  }

  handleDisconnect(client: ISocketAuth) {
    const userId = client.credentials?.user._id?.toString() as string;
    let remainingTabs =
      connectedSockets.get(userId)?.filter((tab: string) => {
        return tab !== client.id;
      }) || [];

    if (remainingTabs.length) {
      connectedSockets.set(userId, remainingTabs);
    } else {
      connectedSockets.delete(userId);
      this.server.emit('offline user ', userId);
    }
    console.log(`logout::${client.id}`);
    console.log({ 'after logout': connectedSockets });
  }





  @Auth([RoleEnum.admin, RoleEnum.user])
  @SubscribeMessage('sayHi')
  sayHi(
    @MessageBody() data: any,
    @ConnectedSocket() client: ISocketAuth,
    @User() user: UserDocument,
  ): string {
    console.log({ user });
    this.server.emit('sayHi', 'Nest To FE');
    return 'received data';
  }


   

  changeProductStock(products: { productId: Types.ObjectId; stock: number }[]) {
    this.server.emit('changeProductStock', products);
  }
  


}
