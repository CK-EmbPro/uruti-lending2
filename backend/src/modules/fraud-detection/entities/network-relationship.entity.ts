import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RelationshipType } from '../dto/network-fraud.dto';

@Entity('network_relationships')
@Index(['sourceApplicationId'])
@Index(['targetApplicationId'])
@Index(['relationshipType'])
@Index(['sharedAttribute'])
@Index(['sourceApplicationId', 'targetApplicationId'])
export class NetworkRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceApplicationId: string;

  @Column()
  targetApplicationId: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relationshipType: RelationshipType;

  @Column()
  sharedAttribute: string;

  @Column({ type: 'int', default: 100 })
  similarityScore: number; // 0-100

  @CreateDateColumn()
  createdAt: Date;
}

