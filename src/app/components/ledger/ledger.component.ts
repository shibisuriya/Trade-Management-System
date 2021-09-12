import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, AbstractControl, Validators } from '@angular/forms';
import { parse, validate } from 'fast-xml-parser'

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
      "totalCalculatedCommission": [null, [Validators.required]],
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
      "qty": [null, [Validators.required, Validators.pattern(/^[0-9]*$/)]],
      "price": [null, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9][0-9]?)?/)]],
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
    day.get('totalCalculatedCommission')?.patchValue(null);
    day.get('calculatedCreditOrDebit')?.patchValue(null);
    (this.ledger.at(i).get('trades') as FormArray).clear()
  }
  getTrades(i: number) {
    return (this.ledger.at(i).get('trades') as FormArray)
  }
  removeTrade(trade: AbstractControl, day: AbstractControl, j: number) {
    let oldTurnover = trade.get('turnover')?.value
    if (oldTurnover != null) {
      let oldTotalTurnover = day.get('totalTurnover')?.value
      let newTotalTurnover = this.roundToTwoDecimals(oldTotalTurnover - oldTurnover);
      day.get('totalTurnover')?.patchValue(newTotalTurnover)
    }
    let oldCalculateCommission = trade.get('calculatedCommission')?.value
    if (oldCalculateCommission != null || oldCalculateCommission != 0) {
      let oldTotalCalculatedCommission = day.get('totalCalculatedCommission')?.value
      let newTotalCalculatedCommission = this.roundToTwoDecimals(oldTotalCalculatedCommission - oldCalculateCommission);
      day.get('totalCalculatedCommission')?.patchValue(newTotalCalculatedCommission)
    }
    let oldTurnoverPlusOrMinusCommission = trade.get('turnoverPlusOrMinusCommission')?.value
    if (oldTurnoverPlusOrMinusCommission != null) {
      let oldCalculatedCreditOrDebit = day.get('calculatedCreditOrDebit')?.value
      let newCalculatedCreditOrDebit = this.roundToTwoDecimals(oldCalculatedCreditOrDebit - oldTurnoverPlusOrMinusCommission)
      day.get('calculatedCreditOrDebit')?.patchValue(newCalculatedCreditOrDebit)
    }
    (day.get('trades') as FormArray).removeAt(j)

  }
  calculate(trade: AbstractControl, day: AbstractControl) {
    let price: number = trade.get('price')?.value
    let qty: number = trade.get('qty')?.value
    if (isNaN(price) || isNaN(qty) || qty == null ||
      price == null || price.toString() == "" || qty.toString() == "" ||
      price == 0 || qty == 0 || price < 0 || qty < 0) {

      let oldTurnover = trade.get('turnover')?.value;
      let oldCalculatedCommission = trade.get('calculatedCommission')?.value;
      let oldTurnoverPlusOrMinusCommission = trade.get('turnoverPlusOrMinusCommission')?.value

      if (oldTurnover != null) {
        let oldTotalTurnover: number = day.get('totalTurnover')?.value
        let newTotalTurnover: number = this.roundToTwoDecimals(oldTotalTurnover - oldTurnover);
        day.get('totalTurnover')?.patchValue(newTotalTurnover)
      }
      if (oldCalculatedCommission != null) {
        let oldTotalCommission: number = day.get('totalCalculatedCommission')?.value
        let newTotalCommission: number = this.roundToTwoDecimals(oldTotalCommission - oldCalculatedCommission)
        day.get("totalCalculatedCommission")?.patchValue(newTotalCommission)
      }
      if (oldTurnoverPlusOrMinusCommission != null) {
        let oldCalculatedCreditOrDebit = day.get('calculatedCreditOrDebit')?.value
        let newCalculatedCreditOrDebit: number = oldCalculatedCreditOrDebit - oldTurnoverPlusOrMinusCommission
        day.get('calculatedCreditOrDebit')?.patchValue(newCalculatedCreditOrDebit)
      }

      trade.get('turnover')?.patchValue(null)
      trade.get('calculatedCommission')?.patchValue(null)
      trade.get('turnoverPlusOrMinusCommission')?.patchValue(null)
      trade.get('commissionBreakdown')?.reset()
      return
    }

    let turnover: number = this.roundToTwoDecimals(price * qty)
    let oldTurnover = trade.get('turnover')?.value;
    let oldTotalTurnover: number = day.get('totalTurnover')?.value
    let newTotalTurnover: number = this.roundToTwoDecimals(oldTotalTurnover - oldTurnover + turnover)
    day.get('totalTurnover')?.patchValue(newTotalTurnover)
    trade.get('turnover')?.patchValue(turnover)

    let intradayOrDelivery: string = trade.get('intradayOrDelivery')?.value
    let buyOrSell: string = trade.get('buyOrSell')?.value
    let exchange: string = trade.get('exchange')?.value
    if (intradayOrDelivery == null || buyOrSell == null || exchange == null)
      return

    let calculatedCommission: number = this.calculateCommission(buyOrSell, intradayOrDelivery, exchange, qty, price, trade)
    let turnoverPlusOrMinusCommission: number = 0;
    if (buyOrSell == "buy") {
      turnoverPlusOrMinusCommission = -(turnover + calculatedCommission)
    } else if (buyOrSell == "sell") {
      turnoverPlusOrMinusCommission = (turnover - calculatedCommission)
    }

    let oldTotalCalculatedCommission: number = day.get('totalCalculatedCommission')?.value
    let oldCalculatedCommission: number = trade.get('calculatedCommission')?.value
    let newTotalCalculatedCommission: number = oldTotalCalculatedCommission - oldCalculatedCommission
    newTotalCalculatedCommission += calculatedCommission
    newTotalCalculatedCommission = this.roundToTwoDecimals(newTotalCalculatedCommission)
    trade.get('calculatedCommission')?.patchValue(calculatedCommission)
    day.get('totalCalculatedCommission')?.patchValue(newTotalCalculatedCommission)

    let oldTurnoverPlusOrMinusCommission: number = trade.get('turnoverPlusOrMinusCommission')?.value
    let oldCalculatedCreditOrDebit: number = day.get('calculatedCreditOrDebit')?.value
    let newCalculatedCreditOrDebit: number = oldCalculatedCreditOrDebit - oldTurnoverPlusOrMinusCommission
    newCalculatedCreditOrDebit += turnoverPlusOrMinusCommission
    newCalculatedCreditOrDebit = this.roundToTwoDecimals(newCalculatedCreditOrDebit)
    day.get('calculatedCreditOrDebit')?.patchValue(newCalculatedCreditOrDebit)
    trade.get('turnoverPlusOrMinusCommission')?.patchValue(turnoverPlusOrMinusCommission)
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
    return this.roundToTwoDecimals(totalCommission);
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
  fullXmlFile: any;
  contractNotes: any;
  trades: Array<[]> = [];
  public loadXML(event: any) {
    this.fullXmlFile = {}
    this.contractNotes = {}
    this.trades = []

    if (event.target.files == null)
      return;

    let totNumberOfFiles = event.target.files.length
    let file = event.target.files[0];
    let fileReader: FileReader = new FileReader();
    fileReader.readAsText(file);

    fileReader.onloadend = () => {
      this.fullXmlFile = fileReader.result

      let options = {
        trimValues: true,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        ignoreAttributes: false,
        attrNodeName: "@",
        allowBooleanAttributes: true,
        parseNodeValue: true,
        parseAttributeValue: true,
        parseTrueNumberOnly: true,
      };

      if (validate(this.fullXmlFile) === true) {
        this.fullXmlFile = parse(this.fullXmlFile, options);
        this.contractNotes = this.fullXmlFile.contract_note.contracts.contract;
        // Check if the XML file has multiple contract notes.
        if (Array.isArray(this.contractNotes)) {
          for (let contractNote of this.contractNotes) {
            this.trades.push(contractNote.trades.trade)
          }
          // Check if the XML file has single contract note.
        } else if (typeof this.contractNotes === "object" && this.contractNotes !== null) {
          console.log("Only 1 contract exists... ")
          this.trades.push(this.contractNotes.trades.trade)
        }
      }
      // Extract data from the lists of list
      for (let contractNote of this.trades) {
        if (Array.isArray(contractNote)) {
          for (let trades of contractNote) {
            console.log(trades)
          }
        // Dealing with contractNote with single trade.
        } else if(typeof contractNote === "object" && contractNote !== null) {
          console.log(contractNote)
        }
      }

    }
  }
}