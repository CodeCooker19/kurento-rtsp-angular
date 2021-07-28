import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { CustomMaterialModuleModule } from './CustomMaterialModule.module';
import { KurentoVideoComponent } from './kurento-video/kurento-video.component';

@NgModule({
  declarations: [
    AppComponent,
    KurentoVideoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CustomMaterialModuleModule,
    FlexLayoutModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
