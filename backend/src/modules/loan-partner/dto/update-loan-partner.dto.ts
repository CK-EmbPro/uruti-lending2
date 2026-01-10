import { PartialType } from '@nestjs/swagger';
import { CreateLoanPartnerDto } from './create-loan-partner.dto';

export class UpdateLoanPartnerDto extends PartialType(CreateLoanPartnerDto) {}

