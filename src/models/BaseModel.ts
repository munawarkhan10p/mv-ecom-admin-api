import {Column} from 'typeorm';
import { Exclude } from 'class-transformer';
export abstract class BaseModel {
    @Column()
    public createdDate: string;

    @Exclude()
    @Column()
    public modifiedDate: string;
}