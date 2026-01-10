import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JournalEntry, JournalEntryStatus, VoucherType } from './entities/journal-entry.entity';
import { GlEntry } from './entities/gl-entry.entity';
import { Account, AccountType } from './entities/account.entity';
import { CreateJournalEntryDto, CreateGlEntryDto } from './dto/create-journal-entry.dto';
import { AccountService } from './services/account.service';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(GlEntry)
    private readonly glEntryRepository: Repository<GlEntry>,
    private readonly dataSource: DataSource,
    private readonly accountService: AccountService,
  ) {}

  /**
   * Create a journal entry with GL entries
   * Implements Frappe's make_journal_entry logic
   */
  async createJournalEntry(
    createDto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    // Validate GL entries
    if (!createDto.glEntries || createDto.glEntries.length === 0) {
      throw new BadRequestException('At least one GL entry is required');
    }

    // Calculate totals
    const totalDebit = createDto.glEntries.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0,
    );
    const totalCredit = createDto.glEntries.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0,
    );

    // Validate debit = credit
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Total debit (${totalDebit}) must equal total credit (${totalCredit})`,
      );
    }

    // Generate voucher number
    const voucherNo = await this.generateVoucherNumber(
      createDto.voucherType,
      new Date(createDto.postingDate),
    );

    // Create journal entry
    const journalEntry = this.journalEntryRepository.create({
      voucherNo,
      voucherType: createDto.voucherType,
      companyId: createDto.companyId,
      postingDate: new Date(createDto.postingDate),
      valueDate: new Date(createDto.valueDate),
      status: JournalEntryStatus.DRAFT,
      remarks: createDto.remarks,
      referenceType: createDto.referenceType,
      referenceId: createDto.referenceId,
      costCenter: createDto.costCenter,
      totalDebit,
      totalCredit,
    });

    const savedJournalEntry = await this.journalEntryRepository.save(
      journalEntry,
    );

    // Create GL entries with account validation and intelligent creation
    const glEntries: GlEntry[] = [];
    for (const entryDto of createDto.glEntries) {
      // Determine account type based on debit/credit
      const accountType = entryDto.debit > 0 
        ? AccountType.ASSET 
        : AccountType.LIABILITY;

      // Validate or create account intelligently
      const account = await this.validateOrCreateAccount(
        entryDto.account,
        entryDto.accountName || entryDto.account,
        accountType,
        createDto.companyId,
      );

      // Validate against account if provided
      if (entryDto.againstAccount) {
        await this.accountService.validateAccount(
          entryDto.againstAccount,
          createDto.companyId,
        );
      }

      const glEntry = this.glEntryRepository.create({
        journalEntryId: savedJournalEntry.id,
        account: entryDto.account,
        accountName: account.accountName,
        againstAccount: entryDto.againstAccount,
        debit: Number(entryDto.debit || 0),
        credit: Number(entryDto.credit || 0),
        debitInAccountCurrency: Number(entryDto.debit || 0),
        creditInAccountCurrency: Number(entryDto.credit || 0),
        voucherType: createDto.voucherType,
        voucherNo: savedJournalEntry.voucherNo,
        referenceType: createDto.referenceType,
        referenceId: createDto.referenceId,
        partyType: entryDto.partyType,
        party: entryDto.party,
        postingDate: savedJournalEntry.postingDate,
        costCenter: entryDto.costCenter || createDto.costCenter,
        remarks: entryDto.remarks || createDto.remarks,
      });

      const savedGlEntry = await this.glEntryRepository.save(glEntry);
      glEntries.push(savedGlEntry);
    }

    savedJournalEntry.glEntries = glEntries;
    return savedJournalEntry;
  }

  /**
   * Submit a journal entry
   */
  async submitJournalEntry(journalEntryId: string): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryRepository.findOne({
      where: { id: journalEntryId },
      relations: ['glEntries'],
    });

    if (!journalEntry) {
      throw new NotFoundException(
        `Journal entry with ID ${journalEntryId} not found`,
      );
    }

    if (journalEntry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException(
        `Journal entry must be in DRAFT status to submit. Current status: ${journalEntry.status}`,
      );
    }

    journalEntry.status = JournalEntryStatus.SUBMITTED;
    return await this.journalEntryRepository.save(journalEntry);
  }

  /**
   * Cancel a journal entry
   */
  async cancelJournalEntry(journalEntryId: string): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryRepository.findOne({
      where: { id: journalEntryId },
    });

    if (!journalEntry) {
      throw new NotFoundException(
        `Journal entry with ID ${journalEntryId} not found`,
      );
    }

    if (journalEntry.status === JournalEntryStatus.CANCELLED) {
      throw new BadRequestException('Journal entry is already cancelled');
    }

    journalEntry.status = JournalEntryStatus.CANCELLED;
    return await this.journalEntryRepository.save(journalEntry);
  }

  /**
   * Create a simple journal entry (debit one account, credit another)
   * Implements Frappe's make_journal_entry helper function
   */
  async createSimpleJournalEntry(
    postingDate: Date,
    valueDate: Date,
    companyId: string,
    loanId: string,
    amount: number,
    debitAccount: string,
    creditAccount: string,
    remarks?: string,
    isReverse: boolean = false,
  ): Promise<JournalEntry> {
    if (amount <= 0) {
      return null; // Skip zero amounts
    }

    // Swap accounts if reverse
    const finalDebitAccount = isReverse ? creditAccount : debitAccount;
    const finalCreditAccount = isReverse ? debitAccount : creditAccount;

    const createDto: CreateJournalEntryDto = {
      voucherType: VoucherType.JOURNAL_ENTRY,
      companyId,
      postingDate: postingDate.toISOString().split('T')[0],
      valueDate: valueDate.toISOString().split('T')[0],
      referenceType: 'Loan',
      referenceId: loanId,
      remarks: remarks || `Journal entry for loan ${loanId}`,
      glEntries: [
        {
          account: finalDebitAccount,
          debit: amount,
          credit: 0,
        },
        {
          account: finalCreditAccount,
          debit: 0,
          credit: amount,
        },
      ],
    };

    const journalEntry = await this.createJournalEntry(createDto);
    // Auto-submit simple entries
    return await this.submitJournalEntry(journalEntry.id);
  }

  /**
   * Find journal entries by reference
   */
  async findByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<JournalEntry[]> {
    return await this.journalEntryRepository.find({
      where: {
        referenceType,
        referenceId,
      },
      relations: ['glEntries'],
      order: { postingDate: 'DESC' },
    });
  }

  /**
   * Find all journal entries with optional filters
   */
  async findAll(filters?: {
    companyId?: string;
    status?: string;
    voucherType?: string;
    referenceType?: string;
    referenceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<JournalEntry[]> {
    const queryBuilder = this.journalEntryRepository
      .createQueryBuilder('journalEntry')
      .leftJoinAndSelect('journalEntry.glEntries', 'glEntry')
      .orderBy('journalEntry.postingDate', 'DESC')
      .addOrderBy('journalEntry.createdAt', 'DESC');

    if (filters?.companyId) {
      queryBuilder.andWhere('journalEntry.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('journalEntry.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.voucherType) {
      queryBuilder.andWhere('journalEntry.voucherType = :voucherType', {
        voucherType: filters.voucherType,
      });
    }

    if (filters?.referenceType) {
      queryBuilder.andWhere('journalEntry.referenceType = :referenceType', {
        referenceType: filters.referenceType,
      });
    }

    if (filters?.referenceId) {
      queryBuilder.andWhere('journalEntry.referenceId = :referenceId', {
        referenceId: filters.referenceId,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('journalEntry.postingDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('journalEntry.postingDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Find journal entry by ID
   */
  async findOne(id: string): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryRepository.findOne({
      where: { id },
      relations: ['glEntries'],
    });

    if (!journalEntry) {
      throw new NotFoundException(
        `Journal entry with ID ${id} not found`,
      );
    }

    return journalEntry;
  }

  /**
   * Generate voucher number
   */
  private async generateVoucherNumber(
    voucherType: VoucherType,
    postingDate: Date,
  ): Promise<string> {
    const year = postingDate.getFullYear();
    const month = String(postingDate.getMonth() + 1).padStart(2, '0');
    const prefix = this.getVoucherPrefix(voucherType);

    // Find the last voucher number for this type and month
    const lastEntry = await this.journalEntryRepository.findOne({
      where: {
        voucherType,
      },
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastEntry) {
      const lastVoucherNo = lastEntry.voucherNo;
      const match = lastVoucherNo.match(/\d+$/);
      if (match) {
        sequence = parseInt(match[0], 10) + 1;
      }
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Get voucher prefix based on type
   */
  private getVoucherPrefix(voucherType: VoucherType): string {
    const prefixes = {
      [VoucherType.JOURNAL_ENTRY]: 'JE',
      [VoucherType.DISBURSEMENT]: 'DISB',
      [VoucherType.REPAYMENT]: 'REP',
      [VoucherType.WRITE_OFF]: 'WO',
      [VoucherType.REFUND]: 'REF',
      [VoucherType.ADJUSTMENT]: 'ADJ',
    };
    return prefixes[voucherType] || 'JE';
  }

  /**
   * Create accounting entries for loan disbursement
   * Implements Frappe's disbursement GL entry logic
   */
  async createDisbursementEntries(
    loanId: string,
    disbursementId: string,
    companyId: string,
    postingDate: Date,
    valueDate: Date,
    disbursedAmount: number,
    loanAccount: string,
    disbursementAccount: string,
    applicantType?: string,
    applicantId?: string,
    costCenter?: string,
  ): Promise<JournalEntry> {
    const glEntries: CreateGlEntryDto[] = [
      {
        account: loanAccount,
        againstAccount: disbursementAccount,
        debit: disbursedAmount,
        credit: 0,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Disbursement against loan: ${loanId}`,
      },
      {
        account: disbursementAccount,
        againstAccount: loanAccount,
        debit: 0,
        credit: disbursedAmount,
        costCenter,
        remarks: `Disbursement against loan: ${loanId}`,
      },
    ];

    const createDto: CreateJournalEntryDto = {
      voucherType: VoucherType.DISBURSEMENT,
      companyId,
      postingDate: postingDate.toISOString().split('T')[0],
      valueDate: valueDate.toISOString().split('T')[0],
      referenceType: 'Loan Disbursement',
      referenceId: disbursementId,
      costCenter,
      remarks: `Disbursement against loan: ${loanId}`,
      glEntries,
    };

    const journalEntry = await this.createJournalEntry(createDto);
    return await this.submitJournalEntry(journalEntry.id);
  }

  /**
   * Create accounting entries for loan repayment
   * Implements Frappe's repayment GL entry logic
   */
  async createRepaymentEntries(
    loanId: string,
    repaymentId: string,
    companyId: string,
    postingDate: Date,
    valueDate: Date,
    paymentAccount: string,
    loanAccount: string,
    principalPaid: number,
    interestPaid: number,
    penaltyPaid: number,
    interestReceivableAccount?: string,
    penaltyReceivableAccount?: string,
    applicantType?: string,
    applicantId?: string,
    costCenter?: string,
    repaymentType?: string,
  ): Promise<JournalEntry> {
    const glEntries: CreateGlEntryDto[] = [];

    // Principal entry
    if (principalPaid > 0) {
      glEntries.push({
        account: paymentAccount,
        againstAccount: loanAccount,
        debit: principalPaid,
        credit: 0,
        costCenter,
        remarks: `Principal repayment for loan: ${loanId}`,
      });
      glEntries.push({
        account: loanAccount,
        againstAccount: paymentAccount,
        debit: 0,
        credit: principalPaid,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Principal repayment for loan: ${loanId}`,
      });
    }

    // Interest entry
    if (interestPaid > 0) {
      const againstAccount = interestReceivableAccount || loanAccount;
      glEntries.push({
        account: paymentAccount,
        againstAccount,
        debit: interestPaid,
        credit: 0,
        costCenter,
        remarks: `Interest repayment for loan: ${loanId}`,
      });
      glEntries.push({
        account: againstAccount,
        againstAccount: paymentAccount,
        debit: 0,
        credit: interestPaid,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Interest repayment for loan: ${loanId}`,
      });
    }

    // Penalty entry
    if (penaltyPaid > 0) {
      const againstAccount = penaltyReceivableAccount || loanAccount;
      glEntries.push({
        account: paymentAccount,
        againstAccount,
        debit: penaltyPaid,
        credit: 0,
        costCenter,
        remarks: `Penalty repayment for loan: ${loanId}`,
      });
      glEntries.push({
        account: againstAccount,
        againstAccount: paymentAccount,
        debit: 0,
        credit: penaltyPaid,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Penalty repayment for loan: ${loanId}`,
      });
    }

    if (glEntries.length === 0) {
      return null; // No entries to create
    }

    const createDto: CreateJournalEntryDto = {
      voucherType: VoucherType.REPAYMENT,
      companyId,
      postingDate: postingDate.toISOString().split('T')[0],
      valueDate: valueDate.toISOString().split('T')[0],
      referenceType: 'Loan Repayment',
      referenceId: repaymentId,
      costCenter,
      remarks: `Repayment for loan: ${loanId} (Type: ${repaymentType || 'Normal'})`,
      glEntries,
    };

    const journalEntry = await this.createJournalEntry(createDto);
    return await this.submitJournalEntry(journalEntry.id);
  }

  /**
   * Create accounting entries for loan write-off
   * Implements Frappe's write-off GL entry logic
   */
  async createWriteOffEntries(
    loanId: string,
    writeOffId: string,
    companyId: string,
    postingDate: Date,
    valueDate: Date,
    writeOffAmount: number,
    writeOffAccount: string,
    loanAccount: string,
    applicantType?: string,
    applicantId?: string,
    costCenter?: string,
  ): Promise<JournalEntry> {
    const glEntries: CreateGlEntryDto[] = [
      {
        account: writeOffAccount,
        againstAccount: loanAccount,
        debit: writeOffAmount,
        credit: 0,
        costCenter,
        remarks: `Write-off for loan: ${loanId}`,
      },
      {
        account: loanAccount,
        againstAccount: writeOffAccount,
        debit: 0,
        credit: writeOffAmount,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Write-off for loan: ${loanId}`,
      },
    ];

    const createDto: CreateJournalEntryDto = {
      voucherType: VoucherType.WRITE_OFF,
      companyId,
      postingDate: postingDate.toISOString().split('T')[0],
      valueDate: valueDate.toISOString().split('T')[0],
      referenceType: 'Loan Write Off',
      referenceId: writeOffId,
      costCenter,
      remarks: `Write-off for loan: ${loanId}`,
      glEntries,
    };

    const journalEntry = await this.createJournalEntry(createDto);
    return await this.submitJournalEntry(journalEntry.id);
  }

  /**
   * Create accounting entries for loan refund
   * Implements Frappe's refund GL entry logic
   */
  async createRefundEntries(
    loanId: string,
    refundId: string,
    companyId: string,
    postingDate: Date,
    valueDate: Date,
    refundAmount: number,
    refundAccount: string,
    paymentAccount: string,
    applicantType?: string,
    applicantId?: string,
    costCenter?: string,
    isExcessAmountRefund?: boolean,
  ): Promise<JournalEntry> {
    const glEntries: CreateGlEntryDto[] = [
      {
        account: refundAccount,
        againstAccount: paymentAccount,
        debit: refundAmount,
        credit: 0,
        partyType: applicantType,
        party: applicantId,
        costCenter,
        remarks: `Refund for loan: ${loanId}${isExcessAmountRefund ? ' (Excess Amount)' : ''}`,
      },
      {
        account: paymentAccount,
        againstAccount: refundAccount,
        debit: 0,
        credit: refundAmount,
        costCenter,
        remarks: `Refund for loan: ${loanId}${isExcessAmountRefund ? ' (Excess Amount)' : ''}`,
      },
    ];

    const createDto: CreateJournalEntryDto = {
      voucherType: VoucherType.REFUND,
      companyId,
      postingDate: postingDate.toISOString().split('T')[0],
      valueDate: valueDate.toISOString().split('T')[0],
      referenceType: 'Loan Refund',
      referenceId: refundId,
      costCenter,
      remarks: `Refund for loan: ${loanId}${isExcessAmountRefund ? ' (Excess Amount)' : ''}`,
      glEntries,
    };

    const journalEntry = await this.createJournalEntry(createDto);
    return await this.submitJournalEntry(journalEntry.id);
  }

  /**
   * Validate or create account intelligently
   */
  private async validateOrCreateAccount(
    accountCode: string,
    accountName: string,
    defaultAccountType: AccountType,
    companyId: string,
    options?: {
      parentAccountCode?: string;
      description?: string;
    },
  ): Promise<Account> {
    try {
      // First, try to validate existing account
      return await this.accountService.validateAccount(accountCode, companyId);
    } catch (error) {
      // If account doesn't exist, create it intelligently
      if (error instanceof NotFoundException) {
        this.logger.log(
          `Account ${accountCode} not found, creating automatically`,
        );

        // Determine account type based on context
        // For lending operations, we can infer account types
        const accountType = this.inferAccountType(accountCode, accountName, defaultAccountType);

        return await this.accountService.findOrCreateAccount(
          accountCode,
          accountName,
          accountType,
          companyId,
          {
            parentAccountCode: options?.parentAccountCode,
            description: options?.description || `Auto-created account for ${accountName}`,
            isGroup: false,
          },
        );
      }
      throw error;
    }
  }

  /**
   * Infer account type from account code or name
   */
  private inferAccountType(
    accountCode: string,
    accountName: string,
    defaultType: AccountType,
  ): AccountType {
    const code = accountCode.toLowerCase();
    const name = accountName.toLowerCase();

    // Asset accounts
    if (
      code.includes('loan') ||
      code.includes('receivable') ||
      code.includes('asset') ||
      name.includes('loan account') ||
      name.includes('receivable')
    ) {
      return AccountType.ASSET;
    }

    // Liability accounts
    if (
      code.includes('payable') ||
      code.includes('deposit') ||
      code.includes('accrued') ||
      name.includes('payable') ||
      name.includes('deposit') ||
      name.includes('accrued')
    ) {
      return AccountType.LIABILITY;
    }

    // Income accounts
    if (
      code.includes('income') ||
      code.includes('revenue') ||
      code.includes('interest income') ||
      code.includes('penalty income') ||
      name.includes('income') ||
      name.includes('revenue')
    ) {
      return AccountType.INCOME;
    }

    // Expense accounts
    if (
      code.includes('expense') ||
      code.includes('write-off') ||
      code.includes('waiver') ||
      name.includes('expense') ||
      name.includes('write-off') ||
      name.includes('waiver')
    ) {
      return AccountType.EXPENSE;
    }

    // Default based on transaction context
    return defaultType;
  }
}

