import { Injectable } from "@nestjs/common";
import { compareHash, generateHash } from './../utils/security/hash.security';


@Injectable()
export class SecurityService {
    constructor(){}

    generateHash = generateHash
    compareHash = compareHash
}