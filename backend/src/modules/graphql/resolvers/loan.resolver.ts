// Note: Uncomment when GraphQL packages are installed:
// npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express graphql-subscriptions
//
// import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { Loan } from '../../loan/entities/loan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { PubSub } from 'graphql-subscriptions';

// const pubSub = new PubSub();

// @Resolver(() => Loan)
export class LoanResolver {
  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
  ) {}

  // @Query(() => [Loan], { name: 'loans' })
  async getLoans(
    limit?: number,
    status?: string,
  ): Promise<Loan[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.loanRepository.find({
      where,
      take: limit || 100,
      order: { createdAt: 'DESC' },
    });
  }

  // @Query(() => Loan, { name: 'loan' })
  async getLoan(id: string): Promise<Loan | null> {
    return this.loanRepository.findOne({ where: { id } });
  }

  // @Mutation(() => Loan, { name: 'updateLoanStatus' })
  async updateLoanStatus(
    id: string,
    status: string,
  ): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id } });
    if (!loan) {
      throw new Error(`Loan with ID ${id} not found`);
    }

    loan.status = status as any;
    const updated = await this.loanRepository.save(loan);

    // Publish subscription event
    // await pubSub.publish('loanUpdated', { loanUpdated: updated });

    return updated;
  }

  // @Subscription(() => Loan, { name: 'loanUpdated' })
  loanUpdated(): any {
    // return pubSub.asyncIterator('loanUpdated');
    return null;
  }
}

