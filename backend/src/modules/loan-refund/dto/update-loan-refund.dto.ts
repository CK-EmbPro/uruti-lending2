import { PartialType } from '@nestjs/swagger';
import { CreateLoanRefundDto } from './create-loan-refund.dto';

export class UpdateLoanRefundDto extends PartialType(CreateLoanRefundDto) {}

