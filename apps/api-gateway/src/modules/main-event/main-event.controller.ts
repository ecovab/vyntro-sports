import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { MainEventService } from "./main-event.service";

@Public()
@Controller("main-event")
export class MainEventController {
  constructor(private readonly mainEventService: MainEventService) {}

  @Get()
  current() {
    return this.mainEventService.getCurrent();
  }

  @Get("history")
  history() {
    return this.mainEventService.getHistory();
  }
}
