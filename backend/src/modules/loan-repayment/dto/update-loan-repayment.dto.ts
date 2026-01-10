import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanRepaymentDto } from './create-loan-repayment.dto';

export class UpdateLoanRepaymentDto extends PartialType(CreateLoanRepaymentDto) {}

