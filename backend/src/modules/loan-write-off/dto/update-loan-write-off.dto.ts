import { PartialType } from '@nestjs/swagger';
import { CreateLoanWriteOffDto } from './create-loan-write-off.dto';

export class UpdateLoanWriteOffDto extends PartialType(CreateLoanWriteOffDto) {}

