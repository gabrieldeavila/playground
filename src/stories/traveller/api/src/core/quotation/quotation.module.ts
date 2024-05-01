import { Module } from "@nestjs/common";

import { QuotationController } from "./api/quotation.controller";

@Module({
  controllers: [QuotationController],
})
export class QuoatationModule {}
