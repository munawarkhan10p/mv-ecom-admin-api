import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Todo } from './Todo';
import { Todo1 } from './Todo1';

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @OneToMany(() => Todo, (todo) => todo.author)
    public todos: Todo[];
}