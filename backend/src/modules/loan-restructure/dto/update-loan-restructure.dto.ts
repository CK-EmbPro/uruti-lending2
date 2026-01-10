import { PartialType } from '@nestjs/swagger';
import { CreateLoanRestructureDto } from './create-loan-restructure.dto';

export class UpdateLoanRestructureDto extends PartialType(
  CreateLoanRestructureDto,
) {}

