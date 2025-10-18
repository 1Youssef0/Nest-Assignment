import { IUser } from "src/common";

export class UserService {
  constructor() {}

  allUsers(): IUser[] {
    return [{ id: 2, userName: 'joo', email: 'yous@gmail', password: 'asd1' }];
  }
}


