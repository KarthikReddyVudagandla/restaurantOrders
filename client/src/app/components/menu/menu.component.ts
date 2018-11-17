import { Component, OnInit } from '@angular/core';
import { FoodService } from 'src/app/services/food.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages/module';
import { AuthService } from '../../services/auth.service';
import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Globals } from '../../global';
import { Menu } from 'src/app/models/menu';
// import { BsModalRef, BsModalService } from 'ngx-bootstrap';
//import {Cart} from '../../models/cart';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  itemSearchName: string;
  itemSearchType: string;
  food: Menu;
  curPage: number;
  pageLength: number;
  uid: string;
  imageToShow: any;
  isImageLoading: boolean;
  totalPages: number;
  itemToBeDeleted: string;
  todayDate: Date;
  // modalRef: BsModalRef;
  //cart: Cart;

  public menu = [];
  public cart = {};
  public temp = {
    quantity: Number,
    _id: String,
    menu: String
  }
  public prev_quant;

  constructor(private _foodservice: FoodService,
    private _router: Router,
    private _authService: AuthService,
    private _flashMessages: FlashMessagesService,
    private globals: Globals,
    // private modalService : BsModalService
  ) { }

  ngOnInit() {
    this.itemSearchType = "all";
    this.itemSearchName = "";
    this.pageLength = 12;
    this.fetchFoods();
  }

  fetchFoods() {
    let item_name = this.itemSearchName;
    if (this.itemSearchName == "") {
      item_name = "all";
    }

    this._foodservice.searchItem(this.itemSearchType, item_name).subscribe(
      data => {
        let m: Menu[];
        m = data;
        console.log(m);
        console.log(this.globals.admin);
        if (localStorage.getItem("role") === "admin") {
          this.menu = m;
        } 
        else {
          m.forEach((mn, idx, m) => {
            if (mn.item_availability == 'Y') {
              this.menu.push(mn);
            }
          })
        }
        //this.menu = data;
        console.log(this.menu);
        this.menu.forEach((m, idx, menu) => {
          let item_image_name = m.item_image;
          m.item_image = null;
          this.getImageFromService(item_image_name, idx);
        })
      }, err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this._router.navigate(['/login']);
          }
        }
      });

    this._foodservice.getCart(localStorage.getItem("user_id")).subscribe(data => {
      this.cart = data,
        console.log(" CART ITEMS " + this.cart);
    });
  }

  getImageFromService(image, idx) {
    this.isImageLoading = true;
    this._foodservice.fetchImage(image).subscribe(data => {
      console.log("fetchImage subscribe");
      this.isImageLoading = false;
      console.log(this.isImageLoading);
      this.createImageFromBlob(data, idx);
    }, error => {
      this.isImageLoading = false;
      console.log("Could not find file : " + this.isImageLoading);
    });
  }

  createImageFromBlob(image: Blob, idx) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      console.log(reader);
      this.menu[idx].item_image = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  AddToCart(fid) {
    console.log("clicked item: " + fid + " for user id" + localStorage.getItem("user_id"));
    this._foodservice.addToCart(fid, localStorage.getItem("user_id")).subscribe((info: any) => {
      console.log(info);
      if (info.success) {
        console.log(info.message);
        //this._flashMessages.show("Successfully added to cart", { cssClass: "alert-success", timeout: 1000 });
        this._foodservice.getCart(localStorage.getItem("user_id")).subscribe(data => {
          this.cart = data,
            console.log("THIS>CART>>>>" + this.cart);
        });
        //this.cartComponent.ngOnInit();
      } else {
        this._flashMessages.show("Failed to insert to cart", { cssClass: "alert-danger", timeout: 2500 });

      }
    })

  }


  DeleteFromCart(fid) {

    var info;
    info = {
      quantity: 0
    };
    console.log("clicked item: " + fid + " for user id" + localStorage.getItem("user_id"));
    this._foodservice.UpdateCart(fid, localStorage.getItem("user_id"), info).subscribe((info: any) => {
      console.log(info);
      if (info.success) {
        console.log(info.message);
        //this._flashMessages.show("Successfully deleted cart", { cssClass: "alert-success", timeout: 1000 });
        this._foodservice.getCart(localStorage.getItem("user_id")).subscribe(data => {
          this.cart = data,
            console.log("CART--> " + this.cart);
        });
        //this.cartComponent.ngOnInit();
      } else {
        this._flashMessages.show("Failed to delete from cart", { cssClass: "alert-danger", timeout: 2500 });

      }
    })

  }
  UpdateCart(fid, quantity) {
    var info;
    info = {
      quantity: quantity
    };
    console.log("clicked item: " + fid + " for user id" + localStorage.getItem("user_id"));
    this._foodservice.UpdateCart(fid, localStorage.getItem("user_id"), info).subscribe((info: any) => {
      console.log(info);
      if (info.success) {
        console.log(info.message);
        //this._flashMessages.show("Successfully updated cart", { cssClass: "alert-success", timeout: 1000 });
        this._foodservice.getCart(localStorage.getItem("user_id")).subscribe(data => {
          this.cart = data,
            console.log("CART--> " + this.cart);
        });
        //this.cartComponent.ngOnInit();
      } else {
        this._flashMessages.show("Failed to update  cart", { cssClass: "alert-danger", timeout: 2500 });

      }
    })
  }

  PlaceOrder() {
    this._foodservice.PlaceOrder(localStorage.getItem("user_id")).subscribe((info: any) => {
      console.log(info);

      if (info.success) {
        console.log(info.message);
        this._flashMessages.show("Successfully placed order", { cssClass: "alert-success", timeout: 1000 });
        this._foodservice.getCart(localStorage.getItem("user_id")).subscribe(data => {
          this.cart = data,
            console.log("CART--> " + this.cart);
        });

      } else {
        this._flashMessages.show("Failed to place Order", { cssClass: "alert-danger", timeout: 2500 });
      }
    })


  }

  ViewOrders() {

    this._router.navigate(['order']);
  }

  deleteItem(fid) {
    this._foodservice.deleteItem(fid).subscribe(info => {
      // if (info.success == true) {
      // this.modalRef.hide();
      this._flashMessages.show("Successfully deleted Item ", { cssClass: "alert-success", timeout: 2000 });
      // this._router.navigate(['/menu']);
      this.fetchFoods();
      // } else {
      // this. _flashMessages.show("Something went wrong", { cssClass: "alert-danger", timeout: 2000 });
      // }
    })
  }
  
}

