import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registrationForm: FormGroup = this._fb.group({
    username: [null, [Validators.required]],
    email: [null, [Validators.required]],
    password: [null, [Validators.required]],
    confirmPassword: [null, [Validators.required]]
  })
  constructor(private _fb: FormBuilder) { }

  ngOnInit(): void {
  }

}
