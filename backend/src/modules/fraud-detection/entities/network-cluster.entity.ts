import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RelationshipType } from '../dto/network-fraud.dto';

@Entity('network_clusters')
@Index(['flagged'])
@Index(['riskScore'])
@Index(['createdAt'])
export class NetworkCluster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'simple-array' })
  applicationIds: string[]; // Array of application IDs in cluster

  @Column({ type: 'int' })
  size: number; // Number of applications in cluster

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  density: number; // Cluster density (0-1)

  @Column({ type: 'simple-array' })
  relationshipTypes: string[]; // Array of RelationshipType values

  @Column({ type: 'boolean', default: false })
  flagged: boolean; // Whether cluster is flagged for fraud

  @Column({ type: 'int', default: 0 })
  fraudulentMembers: number; // Number of fraudulent members

  @Column({ type: 'int', default: 0 })
  defaultedMembers: number; // Number of defaulted members

  @Column({ type: 'int', default: 0 })
  riskScore: number; // Cluster risk score (0-100)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

