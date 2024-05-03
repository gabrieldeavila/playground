import { Module } from "@nestjs/common";

import { QuotationController } from "./api/quotation.controller";
import { PuppeteerService } from "./api/quotation.service";

@Module({
  controllers: [QuotationController],
  providers: [PuppeteerService],
})
export class QuoatationModule {}
