import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = this._fb.group({
    username: [null, [Validators.required]],
    password: [null, [Validators.required]]
  })
  constructor(private _fb: FormBuilder) { }

  ngOnInit(): void {
  }
  login() {

  }
}
