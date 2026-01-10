import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanSecurityDto } from './create-loan-security.dto';

export class UpdateLoanSecurityDto extends PartialType(CreateLoanSecurityDto) {}

