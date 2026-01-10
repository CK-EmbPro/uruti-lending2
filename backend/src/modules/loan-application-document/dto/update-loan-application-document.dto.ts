import { PartialType } from '@nestjs/swagger';
import { CreateLoanApplicationDocumentDto } from './create-loan-application-document.dto';

export class UpdateLoanApplicationDocumentDto extends PartialType(
  CreateLoanApplicationDocumentDto,
) {}

