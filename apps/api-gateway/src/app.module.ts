import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { NewsModule } from "./modules/news/news.module";
import { MainEventModule } from "./modules/main-event/main-event.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { SearchModule } from "./modules/search/search.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HealthModule,
    AuthModule,
    MatchesModule,
    NewsModule,
    MainEventModule,
    BillingModule,
    NotificationsModule,
    FavoritesModule,
    SearchModule,
    AdminModule,
  ],
})
export class AppModule {}
