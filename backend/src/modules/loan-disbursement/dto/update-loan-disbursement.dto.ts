import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanDisbursementDto } from './create-loan-disbursement.dto';

export class UpdateLoanDisbursementDto extends PartialType(CreateLoanDisbursementDto) {}

