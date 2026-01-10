import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanSecurityAssignment, LoanSecurityAssignmentStatus } from './entities/loan-security-assignment.entity';
import { Pledge } from './entities/pledge.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication, ApplicationStatus } from '../loan-application/entities/loan-application.entity';
import { CreateLoanSecurityAssignmentDto } from './dto/create-loan-security-assignment.dto';
import { LoanSecurityShortfallService } from '../loan-security-shortfall/loan-security-shortfall.service';

@Injectable()
export class LoanSecurityAssignmentService {
  constructor(
    @InjectRepository(LoanSecurityAssignment)
    private readonly assignmentRepository: Repository<LoanSecurityAssignment>,
    @InjectRepository(Pledge)
    private readonly pledgeRepository: Repository<Pledge>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @Inject(forwardRef(() => LoanSecurityShortfallService))
    private readonly shortfallService: LoanSecurityShortfallService,
  ) {}

  async create(
    createDto: CreateLoanSecurityAssignmentDto,
  ): Promise<LoanSecurityAssignment> {
    // Validate loan exists if provided
    if (createDto.loanId) {
      const loan = await this.loanRepository.findOne({
        where: { id: createDto.loanId },
      });
      if (!loan) {
        throw new NotFoundException(`Loan with ID ${createDto.loanId} not found`);
      }
    }

    // Validate pledges
    if (!createDto.pledges || createDto.pledges.length === 0) {
      throw new BadRequestException('At least one pledge is required');
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      loanId: createDto.loanId,
      loanApplicationId: createDto.loanApplicationId,
      applicantType: createDto.applicantType,
      applicantId: createDto.applicantId,
      companyId: createDto.companyId,
      referenceNo: createDto.referenceNo,
      description: createDto.description,
      status: LoanSecurityAssignmentStatus.PLEDGE_REQUESTED,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Create pledges and calculate totals
    let totalSecurityValue = 0;
    let maximumLoanValue = 0;

    for (const pledgeDto of createDto.pledges) {
      if (!pledgeDto.qty || pledgeDto.qty <= 0) {
        throw new BadRequestException('Pledge quantity must be greater than 0');
      }

      // Calculate amount and post-haircut amount
      const price = pledgeDto.loanSecurityPrice || 0;
      const amount = pledgeDto.qty * price;
      const haircut = pledgeDto.haircut || 0;
      const postHaircutAmount = amount * (1 - haircut / 100);

      const pledge = this.pledgeRepository.create({
        loanSecurityAssignmentId: savedAssignment.id,
        loanSecurityId: pledgeDto.loanSecurityId,
        qty: pledgeDto.qty,
        loanSecurityPrice: price,
        haircut: haircut,
        amount: amount,
        postHaircutAmount: postHaircutAmount,
      });

      await this.pledgeRepository.save(pledge);

      totalSecurityValue += amount;
      maximumLoanValue += postHaircutAmount;
    }

    // Update assignment totals
    savedAssignment.totalSecurityValue = totalSecurityValue;
    savedAssignment.maximumLoanValue = maximumLoanValue;
    await this.assignmentRepository.save(savedAssignment);

    return savedAssignment;
  }

  async submit(id: string): Promise<LoanSecurityAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.status !== LoanSecurityAssignmentStatus.PLEDGE_REQUESTED) {
      throw new BadRequestException(
        `Assignment can only be submitted from PLEDGE_REQUESTED status. Current status: ${assignment.status}`,
      );
    }

    // Update status and pledge time
    assignment.status = LoanSecurityAssignmentStatus.PLEDGED;
    assignment.pledgeTime = new Date();

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Update loan's maximumLoanAmount if loan exists
    if (assignment.loanId) {
      await this.updateLoanMaximumAmount(assignment.loanId);
    }

    return savedAssignment;
  }

  async findAll(loanId?: string): Promise<LoanSecurityAssignment[]> {
    const where: any = {};
    if (loanId) {
      where.loanId = loanId;
    }

    return await this.assignmentRepository.find({
      where,
      relations: ['pledges'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LoanSecurityAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['pledges'],
    });

    if (!assignment) {
      throw new NotFoundException(
        `Security assignment with ID ${id} not found`,
      );
    }

    return assignment;
  }

  async findByLoanId(loanId: string): Promise<LoanSecurityAssignment[]> {
    return await this.assignmentRepository.find({
      where: { loanId, status: LoanSecurityAssignmentStatus.PLEDGED },
      relations: ['pledges'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get pledged security quantities for a loan
   * Returns map of securityId -> quantity
   */
  async getPledgedSecurityQty(loanId: string): Promise<Map<string, number>> {
    const assignments = await this.findByLoanId(loanId);
    const qtyMap = new Map<string, number>();

    for (const assignment of assignments) {
      for (const pledge of assignment.pledges) {
        const currentQty = qtyMap.get(pledge.loanSecurityId) || 0;
        qtyMap.set(pledge.loanSecurityId, currentQty + Number(pledge.qty));
      }
    }

    return qtyMap;
  }

  /**
   * Get maximum loan amount from all pledged securities for a loan
   */
  async getMaximumLoanAmount(loanId: string): Promise<number> {
    const assignments = await this.findByLoanId(loanId);
    return assignments.reduce(
      (sum, assignment) => sum + Number(assignment.maximumLoanValue),
      0,
    );
  }

  /**
   * Update loan's maximumLoanAmount based on all pledged securities
   */
  private async updateLoanMaximumAmount(loanId: string): Promise<void> {
    const maximumLoanAmount = await this.getMaximumLoanAmount(loanId);
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (loan) {
      loan.maximumLoanAmount = maximumLoanAmount;
      loan.isSecuredLoan = true;
      await this.loanRepository.save(loan);
    }
  }

  async cancel(id: string): Promise<LoanSecurityAssignment> {
    const assignment = await this.findOne(id);
    assignment.status = LoanSecurityAssignmentStatus.CANCELLED;
    return await this.assignmentRepository.save(assignment);
  }

  /**
   * Create loan security assignment from application
   * Business Rule: Creates security assignment from approved loan application's proposed pledges
   */
  async createFromApplication(
    loanApplicationId: string,
    loanId?: string,
  ): Promise<LoanSecurityAssignment> {
    // Get loan application
    const application = await this.applicationRepository.findOne({
      where: { id: loanApplicationId },
    });

    if (!application) {
      throw new NotFoundException(
        `Loan application with ID ${loanApplicationId} not found`,
      );
    }

    // Business Rule: Only approved applications can create security assignments
    if (application.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException(
        `Security assignment can only be created from APPROVED applications. Current status: ${application.status}`,
      );
    }

    // Business Rule: Secured loans must have proposed pledges
    if (!application.isSecuredLoan) {
      throw new BadRequestException(
        'Security assignment can only be created for secured loans',
      );
    }

    // Check if assignment already exists for this application
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        loanApplicationId: application.id,
        status: LoanSecurityAssignmentStatus.PLEDGED,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Security assignment already exists for this application. Assignment ID: ${existingAssignment.id}`,
      );
    }

    // TODO: Get proposed pledges from application
    // For now, we'll create with empty pledges and user can add them
    // In a full implementation, we'd have a ProposedPledge entity in LoanApplication

    const assignment = this.assignmentRepository.create({
      loanApplicationId: application.id,
      loanId: loanId || null,
      applicantType: application.applicantType as any,
      applicantId: application.applicantId,
      companyId: application.companyId,
      status: LoanSecurityAssignmentStatus.PLEDGE_REQUESTED,
      description: `Security assignment created from application ${application.applicationNumber}`,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // If loan is provided, link it and update loan maximum amount
    if (loanId) {
      const loan = await this.loanRepository.findOne({ where: { id: loanId } });
      if (loan) {
        savedAssignment.loanId = loanId;
        savedAssignment.status = LoanSecurityAssignmentStatus.PLEDGED;
        savedAssignment.pledgeTime = new Date();
        await this.assignmentRepository.save(savedAssignment);
        await this.updateLoanMaximumAmount(loanId);
      }
    }

    return savedAssignment;
  }

  /**
   * Unpledge security
   * Business Rule: Creates a release request to unpledge securities
   */
  async unpledgeSecurity(
    loanId: string,
    securityMap?: Map<string, number>,
  ): Promise<LoanSecurityAssignment> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${loanId} not found`);
    }

    // Get all pledged assignments for this loan
    const assignments = await this.findByLoanId(loanId);

    if (assignments.length === 0) {
      throw new BadRequestException(
        `No pledged securities found for loan ${loanId}`,
      );
    }

    // If no security map provided, unpledge all securities
    if (!securityMap || securityMap.size === 0) {
      // Unpledge all assignments
      for (const assignment of assignments) {
        assignment.status = LoanSecurityAssignmentStatus.UNPLEDGED;
        assignment.releaseTime = new Date();
        await this.assignmentRepository.save(assignment);
      }

      // Update loan maximum amount
      await this.updateLoanMaximumAmount(loanId);

      return assignments[0]; // Return first assignment
    }

    // Partial unpledge - create release request
    // For now, we'll mark as RELEASE_REQUESTED
    // In a full implementation, we'd create a LoanSecurityRelease entity
    const assignment = assignments[0];
    assignment.status = LoanSecurityAssignmentStatus.RELEASE_REQUESTED;
    await this.assignmentRepository.save(assignment);

    return assignment;
  }

  /**
   * Release loan security assignment
   * Business Rule: Releases security assignment after approval
   */
  async releaseSecurityAssignment(
    id: string,
  ): Promise<LoanSecurityAssignment> {
    const assignment = await this.findOne(id);

    if (
      assignment.status !== LoanSecurityAssignmentStatus.RELEASE_REQUESTED &&
      assignment.status !== LoanSecurityAssignmentStatus.PLEDGED
    ) {
      throw new BadRequestException(
        `Security assignment can only be released from RELEASE_REQUESTED or PLEDGED status. Current status: ${assignment.status}`,
      );
    }

    // Business Rule: Can only release if loan is closed or fully paid
    if (assignment.loanId) {
      const loan = await this.loanRepository.findOne({
        where: { id: assignment.loanId },
      });

      if (loan) {
        const outstandingPrincipal = Math.max(
          0,
          Number(loan.disbursedAmount) - Number(loan.totalPrincipalPaid),
        );

        if (outstandingPrincipal > 0) {
          throw new BadRequestException(
            `Security cannot be released. Loan has outstanding principal: ${outstandingPrincipal}`,
          );
        }
      }
    }

    assignment.status = LoanSecurityAssignmentStatus.RELEASED;
    assignment.releaseTime = new Date();

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Update loan maximum amount if loan exists
    if (assignment.loanId) {
      await this.updateLoanMaximumAmount(assignment.loanId);
    }

    return savedAssignment;
  }
}

