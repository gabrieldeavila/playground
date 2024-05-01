import { Controller, Get, HttpCode, Inject, Logger } from "@nestjs/common";

@Controller("quotation")
export class QuotationController {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  @Get()
  @HttpCode(200)
  run() {
    this.logger.log("Quoatation endpoint called!");
    return { status: "hohohohaaa" };
  }
}
