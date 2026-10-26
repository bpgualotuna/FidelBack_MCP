import { Module } from '@nestjs/common';
import { CrmController } from './api/controllers/crm.controller';
import { CrmService } from './application/services/crm.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
