import { Body, Controller, Post } from '@nestjs/common';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('execute')
  execute(@Body() dto: ExecuteRequestDto) {
    return this.requestsService.execute(dto);
  }
}
