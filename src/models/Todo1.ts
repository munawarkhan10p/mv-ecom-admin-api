import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Author } from './Author';

@Entity()
export class Todo1 {

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @OneToOne(() => Author)
  @JoinColumn()
  author: Author;
  
}