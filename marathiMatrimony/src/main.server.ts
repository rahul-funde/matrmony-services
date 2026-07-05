
/*
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideServerRendering } from '@angular/platform-server';

export default function (context: any) {
  return bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [provideServerRendering(), ...(appConfig.providers || [])],
  }, context);
}
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { serverRoutes } from './app/app.routes.server';

export default function (context: any) {
  return bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      provideServerRendering(),
      provideServerRouting(serverRoutes),  // ✅ REQUIRED
      ...(appConfig.providers || [])
    ],
  }, context);
}
