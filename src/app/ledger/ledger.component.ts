import { TransitiveCompileNgModuleMetadata } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, AbstractControl, Validators } from '@angular/forms';


@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.css']
})
export class LedgerComponent implements OnInit {
  ledgerForm: FormGroup;

  //Modal variables
  modalBrokerage: number = 0;
  modalStt: number = 0;
  modalTransactionCharges = 0;
  modalGst: number = 0;
  modalSebiCharges: number = 0;
  modalStampCharges: number = 0;
  commissionBreakdownModal: boolean = false;

  constructor(private _fb: FormBuilder) {
    this.ledgerForm = this._fb.group({
      "ledger": this._fb.array([])
    })
  }

  ngOnInit() {

  }
  get ledger(): FormArray {
    return this.ledgerForm.get('ledger') as FormArray;
  }
  addDay() {
    let day = this._fb.group({
      "date": [null, [Validators.required]],
      "creditOrDebit": [null, [Validators.required]],
      "amount": [null, [Validators.required]],
      "totalTurnover": [null, [Validators.required]],
      "calculatedCreditOrDebit": [null, [Validators.required]],
      "totalCommission": [null, [Validators.required]],
      "trades": this._fb.array([])
    });
    this.ledger.push(day)
    this.addTrade(this.ledger.length - 1)
  }
  removeDay(i: number) {
    this.ledger.removeAt(i)
  }
  clearLedger() {
    this.ledger.clear()
  }
  addTrade(i: number) {
    let trade = this._fb.group({
      "tradeNumber": [null, [Validators.required]],
      "qty": [null, [Validators.required]],
      "price": [null, [Validators.required]],
      "intradayOrDelivery": [null, [Validators.required]],
      "exchange": [null, [Validators.required]],
      "buyOrSell": [null, [Validators.required]],
      "turnover": [null, [Validators.required]],
      "calculatedCommission": [null, [Validators.required]],
      "turnoverPlusOrMinusCommission": [null],
      "commissionBreakdown": this._fb.group({
        "brokerage": [null, [Validators.required]],
        "stt": [null, [Validators.required]],
        "transactionCharges": [null, [Validators.required]],
        "gst": [null, [Validators.required]],
        "sebiCharges": [null, [Validators.required]],
        "stampCharges": [null, [Validators.required]]
      })
    });
    (this.ledger.at(i).get('trades') as FormArray).push(trade)
  }
  clearTrades(i: number, day: AbstractControl) {
    day.get('totalTurnover')?.patchValue(null);
    (this.ledger.at(i).get('trades') as FormArray).clear()
  }
  getTrades(i: number) {
    return (this.ledger.at(i).get('trades') as FormArray)
  }
  removeTrade(i: number, j: number, day: AbstractControl) {
    let turnover = this.getTrades(i).at(j).get('turnover')?.value
    if (turnover != null) {
      let oldTotalTurnover = day.get('totalTurnover')?.value
      let newTotalTurnover = oldTotalTurnover - turnover;
      day.get('totalTurnover')?.patchValue(newTotalTurnover)
    }
    this.getTrades(i).removeAt(j)

  }
  calculate(trade: AbstractControl, day: AbstractControl) {
    //Extract data from the the form which is going to be used for the calculation of turnover and commission.
    let price: number = trade.get('price')?.value
    let qty: number = trade.get('qty')?.value
    if (isNaN(price) || isNaN(qty) || qty == null || price == null || price.toString() == "" || qty.toString() == "" || price == 0 || qty == 0 || price < 0 || qty < 0) {
      //Clear turnover, calculated commission, turnover +/- calculated commission and commissionBreakdown (components of commission). 
      let oldTurnover = trade.get('turnover')?.value;
      if (oldTurnover != null) {
        let oldTotalTurnover: number = day.get('totalTurnover')?.value
        let newTotalTurnover: number = oldTotalTurnover - oldTurnover;
        day.get('totalTurnover')?.patchValue(newTotalTurnover)
      }
      trade.get('turnover')?.patchValue(null)
      trade.get('calculatedCommission')?.patchValue(null)
      trade.get('turnoverPlusOrMinusCommission')?.patchValue(null)
      trade.get('commissionBreakdown')?.reset()
      return
    }
    let turnover: number = price * qty

    let oldTurnover = trade.get('turnover')?.value;
    let oldTotalTurnover: number = day.get('totalTurnover')?.value
    let newTotalTurnover: number = oldTotalTurnover - oldTurnover + turnover
    day.get('totalTurnover')?.patchValue(newTotalTurnover)
    trade.get('turnover')?.patchValue(turnover)

    let intradayOrDelivery: string = trade.get('intradayOrDelivery')?.value
    let buyOrSell: string = trade.get('buyOrSell')?.value
    let exchange: string = trade.get('exchange')?.value

    if (intradayOrDelivery == null || buyOrSell == null || exchange == null)
      return

    let calculatedCommission = this.calculateCommission(buyOrSell, intradayOrDelivery, exchange, qty, price, trade)
    let turnoverPlusOrMinusCommission: number = 0;
    trade.get('calculatedCommission')?.patchValue(calculatedCommission)
    if (buyOrSell == "buy") {
      turnoverPlusOrMinusCommission = -(turnover + calculatedCommission)
      trade.get('turnoverPlusOrMinusCommission')?.patchValue(turnoverPlusOrMinusCommission)
    } else if (buyOrSell == "sell") {
      turnoverPlusOrMinusCommission = (turnover - calculatedCommission)
      trade.get('turnoverPlusOrMinusCommission')?.patchValue(turnoverPlusOrMinusCommission)
    }

    //Update calculatedCreditOrDebit in day.  
    let oldCalculatedCreditOrDebit = day.get('calculatedCreditOrDebit')?.value;
    let newCalculatedCreditOrDebit = oldCalculatedCreditOrDebit - turnoverPlusOrMinusCommission
    day.get('calculatedCreditOrDebit')?.patchValue(newCalculatedCreditOrDebit)

  }
  calculateCommission(buyOrSell: string, intradayOrDelivery: string, exchange: string, qty: number, price: number, trade: AbstractControl): number {
    //Constants
    //Common
    const GSTFactor = 18 / 100;
    const sebiChargesFactor = 100 / 10000000;

    //Delivery
    const deliveryTransactionChargesFactorNse = 0.00345 / 100;
    const deliveryTransactionChargesFactorBse = 0.00345 / 100;
    const deliveryStampChargesFactor = 0.015 / 100;
    const zerodhaDpCharges = 15.93;

    //Intraday
    const intradayBrokerageFactor: number = 0.03 / 100;
    const intradaySttFactor: number = 0.025 / 100;
    const intradayTransactionChargesFactorNse = 0.00345 / 100
    const intradayTransactionChargesFactorBse = 0.00345 / 100
    const intradayStampChargesFactor = 0.003 / 100;

    //Variables
    let turnover: number = price * qty;
    let brokerage: number = 0;
    let stt: number = 0;
    let transactionCharges: number = 0;
    let gst: number = 0;
    let sebiCharges: number = 0;
    let stampCharges: number = 0;
    let dpCharges: number = 0;

    //Equity delivery
    if (intradayOrDelivery === "delivery") {
      brokerage = 0.01;
      stt = 0.1 / 100 * turnover;
      if (exchange == "nse")
        transactionCharges = turnover * deliveryTransactionChargesFactorNse;
      else if (exchange == "bse")
        transactionCharges = turnover * deliveryTransactionChargesFactorBse;
      if (buyOrSell === "buy")
        stampCharges = turnover * deliveryStampChargesFactor;
      else if (buyOrSell == "sell") {
        stampCharges = 0;
        dpCharges = zerodhaDpCharges;
      }
    }

    //Equity intrday 
    else if (intradayOrDelivery === "intraday") {
      brokerage = intradayBrokerageFactor * turnover
      if (brokerage > 20)
        brokerage = 20
      if (buyOrSell === "sell") {
        stt = intradaySttFactor * turnover
      }
      else if (buyOrSell == "buy") {
        stt = 0
        stampCharges = intradayStampChargesFactor * turnover;
      }
      if (exchange === "nse")
        transactionCharges = turnover * intradayTransactionChargesFactorNse;
      else if (exchange === "bse")
        transactionCharges = turnover * intradayTransactionChargesFactorBse;
    }

    //Common calculation for intraday and delivery
    gst = GSTFactor * (brokerage + transactionCharges);
    sebiCharges = sebiCharges = sebiChargesFactor * turnover;

    //Round all variable to two decimal places.
    brokerage = this.roundToTwoDecimals(brokerage)
    stt = this.roundToTwoDecimals(stt)
    transactionCharges = this.roundToTwoDecimals(transactionCharges)
    gst = this.roundToTwoDecimals(gst)
    sebiCharges = this.roundToTwoDecimals(sebiCharges)
    stampCharges = this.roundToTwoDecimals(stampCharges)

    //Assign the calculated components of commission to the form controls.
    trade.get('commissionBreakdown')?.get('brokerage')?.patchValue(brokerage);
    trade.get('commissionBreakdown')?.get('stt')?.patchValue(stt)
    trade.get('commissionBreakdown')?.get('transactionCharges')?.patchValue(transactionCharges)
    trade.get('commissionBreakdown')?.get('gst')?.patchValue(gst)
    trade.get('commissionBreakdown')?.get('sebiCharges')?.patchValue(sebiCharges)
    trade.get('commissionBreakdown')?.get('stampCharges')?.patchValue(stampCharges)

    let totalCommission = brokerage + stt + transactionCharges + gst + sebiCharges + stampCharges;
    return totalCommission;
  }

  roundToTwoDecimals(num: number) {
    var m = Number((Math.abs(num) * 100).toPrecision(15));
    return Math.round(m) / 100 * Math.sign(num);
  }
  showCommissionBreakdown(trade: AbstractControl) {
    this.modalBrokerage = trade.get('commissionBreakdown')?.get('brokerage')?.value;
    this.modalStt = trade.get('commissionBreakdown')?.get('stt')?.value
    this.modalTransactionCharges = trade.get('commissionBreakdown')?.get('transactionCharges')?.value
    this.modalGst = trade.get('commissionBreakdown')?.get('gst')?.value
    this.modalSebiCharges = trade.get('commissionBreakdown')?.get('sebiCharges')?.value
    this.modalStampCharges = trade.get('commissionBreakdown')?.get('stampCharges')?.value
    this.commissionBreakdownModal = true;
  }
  stressTest() {
    for (let i = 0; i < 300; i++) {
      this.addDay()
      for (let j = 0; j < 10; j++) [
        this.addTrade(i)
      ]
    }
  }

}