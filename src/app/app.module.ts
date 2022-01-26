import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LedgerComponent } from './components/ledger/ledger.component';
import { ReactiveFormsModule } from '@angular/forms';
import { KiteWebScraperComponent } from './components/kite-web-scraper/kite-web-scraper.component';
import { SharedModule } from './shared/shared.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
@NgModule({
  declarations: [
    AppComponent,
    LedgerComponent,
    KiteWebScraperComponent,
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
