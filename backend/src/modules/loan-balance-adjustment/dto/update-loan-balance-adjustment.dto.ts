import { PartialType } from '@nestjs/swagger';
import { CreateLoanBalanceAdjustmentDto } from './create-loan-balance-adjustment.dto';

export class UpdateLoanBalanceAdjustmentDto extends PartialType(CreateLoanBalanceAdjustmentDto) {}

