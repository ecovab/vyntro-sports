import { Module } from "@nestjs/common";
import { MainEventController } from "./main-event.controller";
import { MainEventService } from "./main-event.service";

@Module({
  controllers: [MainEventController],
  providers: [MainEventService],
  exports: [MainEventService],
})
export class MainEventModule {}
