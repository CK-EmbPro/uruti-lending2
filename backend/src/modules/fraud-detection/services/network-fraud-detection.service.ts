import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { NetworkRelationship } from '../entities/network-relationship.entity';
import { RelationshipType } from '../dto/network-fraud.dto';
import { NetworkCluster } from '../entities/network-cluster.entity';
import {
  NetworkFraudCheckRequestDto,
  NetworkFraudCheckResultDto,
  NetworkGraphDto,
  ClusterDto,
  RelationshipDto,
} from '../dto/network-fraud.dto';
import { IdentityDuplicationCheck } from '../entities/identity-duplication-check.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

/**
 * Network Fraud Detection Service
 * 
 * Detects fraud rings by building relationship graphs from shared attributes
 * and identifying dense clusters that indicate coordinated fraud.
 */
@Injectable()
export class NetworkFraudDetectionService {
  private readonly logger = new Logger(NetworkFraudDetectionService.name);

  // Thresholds
  private readonly MIN_CLUSTER_SIZE = 3; // Minimum cluster size
  private readonly MIN_DENSITY = 0.5; // Minimum cluster density
  private readonly FRAUD_THRESHOLD = 2; // Flag cluster if 2+ members are fraud/default

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(NetworkRelationship)
    private readonly relationshipRepository: Repository<NetworkRelationship>,
    @InjectRepository(NetworkCluster)
    private readonly clusterRepository: Repository<NetworkCluster>,
    @InjectRepository(IdentityDuplicationCheck)
    private readonly duplicationCheckRepository: Repository<IdentityDuplicationCheck>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Check if application is part of a fraud ring
   */
  async checkNetworkFraud(
    dto: NetworkFraudCheckRequestDto,
    companyId: string,
  ): Promise<NetworkFraudCheckResultDto> {
    this.logger.log(`Checking network fraud for application ${dto.applicationId}`);

    // Build relationship graph
    await this.buildRelationshipGraph(companyId);

    // Detect clusters
    const clusters = await this.detectClusters(companyId);

    // Find cluster containing this application
    const applicationCluster = clusters.find((cluster) =>
      cluster.applicationIds.includes(dto.applicationId),
    );

    if (!applicationCluster) {
      return {
        applicationId: dto.applicationId,
        isPartOfRing: false,
        networkRiskScore: 0,
        flaggedForReview: false,
        visualization: dto.includeVisualization
          ? await this.generateVisualization(companyId)
          : undefined,
      };
    }

    // Check if cluster should be flagged
    const flagged = await this.shouldFlagCluster(applicationCluster.id);

    // Calculate network risk score
    const networkRiskScore = this.calculateNetworkRiskScore(applicationCluster);

    return {
      applicationId: dto.applicationId,
      isPartOfRing: true,
      clusterId: applicationCluster.id,
      cluster: this.mapClusterToDto(applicationCluster),
      networkRiskScore,
      flaggedForReview: flagged || networkRiskScore >= 70,
      visualization: dto.includeVisualization
        ? await this.generateVisualization(companyId)
        : undefined,
    };
  }

  /**
   * Build relationship graph from shared attributes
   */
  async buildRelationshipGraph(companyId: string): Promise<void> {
    this.logger.log('Building relationship graph...');

    // Get all applications
    const applications = await this.applicationRepository.find({
      where: { companyId },
      select: ['id', 'applicantId', 'applicantType'],
    });

    // Get all duplication checks for shared attributes
    const duplicationChecks = await this.duplicationCheckRepository.find({
      select: ['applicationId', 'deviceFingerprint', 'phoneNumber', 'email', 'bankAccountNumber', 'idNumber'],
    });

    // Build relationships
    const relationships: NetworkRelationship[] = [];

    for (let i = 0; i < applications.length; i++) {
      for (let j = i + 1; j < applications.length; j++) {
        const app1 = applications[i];
        const app2 = applications[j];

        const check1 = duplicationChecks.find((c) => c.applicationId === app1.id);
        const check2 = duplicationChecks.find((c) => c.applicationId === app2.id);

        if (!check1 || !check2) continue;

        // Check for shared devices
        if (check1.deviceFingerprint && check2.deviceFingerprint && 
            check1.deviceFingerprint === check2.deviceFingerprint) {
          relationships.push(
            this.relationshipRepository.create({
              sourceApplicationId: app1.id,
              targetApplicationId: app2.id,
              relationshipType: RelationshipType.DEVICE,
              sharedAttribute: check1.deviceFingerprint,
              similarityScore: 100,
            }),
          );
        }

        // Check for shared bank accounts
        if (check1.bankAccountNumber && check2.bankAccountNumber &&
            check1.bankAccountNumber === check2.bankAccountNumber) {
          relationships.push(
            this.relationshipRepository.create({
              sourceApplicationId: app1.id,
              targetApplicationId: app2.id,
              relationshipType: RelationshipType.BANK_ACCOUNT,
              sharedAttribute: check1.bankAccountNumber,
              similarityScore: 100,
            }),
          );
        }

        // Check for shared phone numbers
        if (check1.phoneNumber && check2.phoneNumber &&
            check1.phoneNumber === check2.phoneNumber) {
          relationships.push(
            this.relationshipRepository.create({
              sourceApplicationId: app1.id,
              targetApplicationId: app2.id,
              relationshipType: RelationshipType.PHONE,
              sharedAttribute: check1.phoneNumber,
              similarityScore: 100,
            }),
          );
        }

        // Check for shared email
        if (check1.email && check2.email && check1.email === check2.email) {
          relationships.push(
            this.relationshipRepository.create({
              sourceApplicationId: app1.id,
              targetApplicationId: app2.id,
              relationshipType: RelationshipType.EMAIL,
              sharedAttribute: check1.email,
              similarityScore: 100,
            }),
          );
        }

        // Check for shared ID numbers (with fuzzy matching)
        if (check1.idNumber && check2.idNumber) {
          const similarity = this.calculateIdSimilarity(check1.idNumber, check2.idNumber);
          if (similarity >= 0.8) {
            relationships.push(
              this.relationshipRepository.create({
                sourceApplicationId: app1.id,
                targetApplicationId: app2.id,
                relationshipType: RelationshipType.ID_NUMBER,
                sharedAttribute: check1.idNumber,
                similarityScore: similarity * 100,
              }),
            );
          }
        }
      }
    }

    // Save relationships (upsert to avoid duplicates)
    for (const rel of relationships) {
      const existing = await this.relationshipRepository.findOne({
        where: {
          sourceApplicationId: rel.sourceApplicationId,
          targetApplicationId: rel.targetApplicationId,
          relationshipType: rel.relationshipType,
        },
      });

      if (!existing) {
        await this.relationshipRepository.save(rel);
      }
    }

    this.logger.log(`Built ${relationships.length} relationships`);
  }

  /**
   * Detect clusters (dense subgraphs) in the relationship graph
   */
  async detectClusters(companyId: string): Promise<NetworkCluster[]> {
    this.logger.log('Detecting clusters...');

    // Get all relationships
    const relationships = await this.relationshipRepository.find();

    // Build adjacency map
    const adjacencyMap = new Map<string, Set<string>>();

    relationships.forEach((rel) => {
      if (!adjacencyMap.has(rel.sourceApplicationId)) {
        adjacencyMap.set(rel.sourceApplicationId, new Set());
      }
      if (!adjacencyMap.has(rel.targetApplicationId)) {
        adjacencyMap.set(rel.targetApplicationId, new Set());
      }

      adjacencyMap.get(rel.sourceApplicationId)!.add(rel.targetApplicationId);
      adjacencyMap.get(rel.targetApplicationId)!.add(rel.sourceApplicationId);
    });

    // Find clusters using connected components
    const visited = new Set<string>();
    const clusters: NetworkCluster[] = [];

    for (const [appId, neighbors] of adjacencyMap.entries()) {
      if (visited.has(appId)) continue;

      // BFS to find connected component
      const component = new Set<string>();
      const queue = [appId];
      visited.add(appId);
      component.add(appId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentNeighbors = adjacencyMap.get(current) || new Set();

        for (const neighbor of currentNeighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            component.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      // Check if component meets cluster criteria
      if (component.size >= this.MIN_CLUSTER_SIZE) {
        const componentArray = Array.from(component);
        const density = this.calculateDensity(componentArray, relationships);
        const relationshipTypes = this.getRelationshipTypes(componentArray, relationships);

        if (density >= this.MIN_DENSITY) {
          const cluster = this.clusterRepository.create({
            applicationIds: componentArray,
            size: component.size,
            density,
            relationshipTypes,
            flagged: false,
            fraudulentMembers: 0,
            defaultedMembers: 0,
            riskScore: 0,
          });

          const savedCluster = await this.clusterRepository.save(cluster);
          clusters.push(savedCluster);
        }
      }
    }

    this.logger.log(`Detected ${clusters.length} clusters`);
    return clusters;
  }

  /**
   * Check if cluster should be flagged (2+ members fraud/default)
   */
  async shouldFlagCluster(clusterId: string): Promise<boolean> {
    const cluster = await this.clusterRepository.findOne({
      where: { id: clusterId },
    });

    if (!cluster) return false;

    // Count fraudulent and defaulted members
    let fraudulentCount = 0;
    let defaultedCount = 0;

    // Check for fraud flags
    if (cluster.applicationIds && cluster.applicationIds.length > 0) {
      const fraudChecks = await this.duplicationCheckRepository.find({
        where: { applicationId: In(cluster.applicationIds), flaggedForReview: true },
      });
      fraudulentCount = fraudChecks.length;

      // Check for defaulted loans (need to get applicant IDs from applications)
      const applications = await this.applicationRepository.find({
        where: { id: In(cluster.applicationIds) },
        select: ['applicantId'],
      });

      if (applications.length > 0) {
        const applicantIds = applications.map((app) => app.applicantId);
        const loans = await this.loanRepository.find({
          where: {
            applicantId: In(applicantIds),
            status: LoanStatus.WRITTEN_OFF,
          },
        });
        defaultedCount = loans.length;
      }
    }

    // Update cluster
    cluster.fraudulentMembers = fraudulentCount;
    cluster.defaultedMembers = defaultedCount;
    cluster.flagged = fraudulentCount + defaultedCount >= this.FRAUD_THRESHOLD;
    cluster.riskScore = this.calculateClusterRiskScore(cluster);

    await this.clusterRepository.save(cluster);

    return cluster.flagged;
  }

  /**
   * Generate visualization data for network graph
   */
  async generateVisualization(companyId: string): Promise<NetworkGraphDto> {
    const relationships = await this.relationshipRepository.find();
    const clusters = await this.clusterRepository.find({
      where: { flagged: true },
    });

    // Get all unique application IDs
    const applicationIds = new Set<string>();
    relationships.forEach((rel) => {
      applicationIds.add(rel.sourceApplicationId);
      applicationIds.add(rel.targetApplicationId);
    });

    // Get applications
    const applications = await this.applicationRepository.find({
      where: { id: In(Array.from(applicationIds)) },
    });

    // Build nodes
    const nodes = applications.map((app) => {
      const cluster = clusters.find((c) => c.applicationIds.includes(app.id));
      const fraudCheck = relationships.find((r) => 
        r.sourceApplicationId === app.id || r.targetApplicationId === app.id
      );

      return {
        id: app.id,
        applicationId: app.id,
        label: app.applicationNumber || app.id,
        flagged: cluster?.flagged || false,
        fraudulent: cluster?.fraudulentMembers > 0 || false,
        defaulted: cluster?.defaultedMembers > 0 || false,
        riskScore: cluster?.riskScore || 0,
      };
    });

    // Build edges
    const edges: RelationshipDto[] = relationships.map((rel) => ({
      sourceApplicationId: rel.sourceApplicationId,
      targetApplicationId: rel.targetApplicationId,
      relationshipType: rel.relationshipType,
      sharedAttribute: rel.sharedAttribute,
      similarityScore: rel.similarityScore,
    }));

    // Map clusters
    const clusterDtos: ClusterDto[] = clusters.map((cluster) =>
      this.mapClusterToDto(cluster),
    );

    return {
      nodes,
      edges,
      clusters: clusterDtos,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalClusters: clusters.length,
    };
  }

  /**
   * Calculate cluster density
   */
  private calculateDensity(
    component: string[],
    relationships: NetworkRelationship[],
  ): number {
    const n = component.length;
    if (n < 2) return 0;

    const maxEdges = (n * (n - 1)) / 2;
    const actualEdges = relationships.filter(
      (rel) =>
        component.includes(rel.sourceApplicationId) &&
        component.includes(rel.targetApplicationId),
    ).length;

    return actualEdges / maxEdges;
  }

  /**
   * Get relationship types in cluster
   */
  private getRelationshipTypes(
    component: string[],
    relationships: NetworkRelationship[],
  ): RelationshipType[] {
    const types = new Set<RelationshipType>();
    relationships
      .filter(
        (rel) =>
          component.includes(rel.sourceApplicationId) &&
          component.includes(rel.targetApplicationId),
      )
      .forEach((rel) => types.add(rel.relationshipType));
    return Array.from(types);
  }

  /**
   * Calculate ID similarity
   */
  private calculateIdSimilarity(id1: string, id2: string): number {
    // Normalize IDs
    const norm1 = id1.replace(/[\s\-_]/g, '').toUpperCase();
    const norm2 = id2.replace(/[\s\-_]/g, '').toUpperCase();

    if (norm1 === norm2) return 1.0;

    // Levenshtein distance
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLen = Math.max(norm1.length, norm2.length);
    return 1 - distance / maxLen;
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate network risk score
   */
  private calculateNetworkRiskScore(cluster: NetworkCluster): number {
    let score = 0;

    // Base score from cluster size
    score += Math.min(30, cluster.size * 5);

    // Density contribution
    score += cluster.density * 20;

    // Fraudulent members contribution
    score += cluster.fraudulentMembers * 25;

    // Defaulted members contribution
    score += cluster.defaultedMembers * 20;

    return Math.min(100, score);
  }

  /**
   * Calculate cluster risk score
   */
  private calculateClusterRiskScore(cluster: NetworkCluster): number {
    return this.calculateNetworkRiskScore(cluster);
  }

  /**
   * Normalize phone number
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)\+]/g, '');
  }

  /**
   * Map cluster entity to DTO
   */
  private mapClusterToDto(cluster: NetworkCluster): ClusterDto {
    return {
      id: cluster.id,
      applicationIds: cluster.applicationIds,
      size: cluster.size,
      density: cluster.density,
      relationshipTypes: cluster.relationshipTypes as RelationshipType[],
      flagged: cluster.flagged,
      fraudulentMembers: cluster.fraudulentMembers,
      defaultedMembers: cluster.defaultedMembers,
      riskScore: cluster.riskScore,
    };
  }
}

