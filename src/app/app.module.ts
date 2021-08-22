import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LedgerComponent } from './components/ledger/ledger.component';
import { ReactiveFormsModule } from '@angular/forms';
import { KiteWebScraperComponent } from './components/kite-web-scraper/kite-web-scraper.component';

@NgModule({
  declarations: [
    AppComponent,
    LedgerComponent,
    KiteWebScraperComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
