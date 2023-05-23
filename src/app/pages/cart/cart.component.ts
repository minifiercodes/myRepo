import {AfterContentChecked, Component, OnDestroy, OnInit} from '@angular/core';
import {CartService} from '../../services/cart.service';
import {Subject, Subscription} from 'rxjs';
import {UserService} from '../../services/user.service';
import {JwtResponse} from '../../response/JwtResponse';
import {ProductInOrder} from '../../models/ProductInOrder';
import {debounceTime, switchMap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {Role} from '../../enum/Role';
//import { particlesJS } from "../node_modules/tsparticles/dist/tsparticles.js"; 

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy, AfterContentChecked {

    constructor(private cartService: CartService,
                private userService: UserService,
                private router: Router) {
        this.userSubscription = this.userService.currentUser.subscribe(user => this.currentUser = user);
    }

    productInOrders = [] as any[];
    total = 0;
    currentUser!: JwtResponse;
    userSubscription: Subscription;

    private updateTerms = new Subject<ProductInOrder>();
    sub!: Subscription;

    static validateCount(productInOrder: { productStock: any; count: number; }) {
        const max = productInOrder.productStock;
        if (productInOrder.count > max) {
            productInOrder.count = max;
        } else if (productInOrder.count < 1) {
            productInOrder.count = 1;
        }
        console.log(productInOrder.count);
    }

    ngOnInit() {
        this.cartService.getCart().subscribe(prods => {
            this.productInOrders = prods;
        });

        this.sub = this.updateTerms.pipe(
            // wait 300ms after each keystroke before considering the term
            debounceTime(300),
            //
            // ignore new term if same as previous term
            // Same Object Reference, not working here
            //  distinctUntilChanged((p: ProductInOrder, q: ProductInOrder) => p.count === q.count),
            //
            // switch to new search observable each time the term changes
            switchMap((productInOrder: ProductInOrder) => this.cartService.update(productInOrder))
        ).subscribe(prod => {
                if (prod) { throw new Error(); }
            },
            _ => console.log('Update Item Failed'));
    }

    ngOnDestroy() {
        if (!this.currentUser) {
            this.cartService.storeLocalCart();
        }
        this.userSubscription.unsubscribe();
    }

    ngAfterContentChecked() {
        this.total = this.productInOrders.reduce(
            (prev, cur) => prev + cur.count * cur.productPrice, 0);
    }

    addOne(productInOrder: ProductInOrder) {
        productInOrder.count++;
        CartComponent.validateCount(productInOrder);
        if (this.currentUser) { this.updateTerms.next(productInOrder); }
    }

    minusOne(productInOrder: ProductInOrder) {
        productInOrder.count--;
        CartComponent.validateCount(productInOrder);
        if (this.currentUser) { this.updateTerms.next(productInOrder); }
    }

    onChange(productInOrder: ProductInOrder) {
        CartComponent.validateCount(productInOrder);
        if (this.currentUser) { this.updateTerms.next(productInOrder); }
    }

    /*
    remove(productInOrder: ProductInOrder) {
        this.cartService.remove(productInOrder).subscribe?( (res: any) =>
            {         
                if(res.body.data.result === 'fail') {
                    console.log('Remove Cart Failed');
                } 
                
                else {     
                    this.productInOrders = this.productInOrders.filter(e => e.productId !== productInOrder.productId);
                    console.log('Cart: ' + this.productInOrders);
                }           
            }  
        );
    }*/
////////////////////////////////
    /*
    remove(productInOrder: ProductInOrder) {
        this.cartService.remove(productInOrder).subscribe?(() => {            
            this.productInOrders = this.productInOrders.filter(e => e.productId !== productInOrder.productId),            
            console.log('Cart: ' + this.productInOrders )
        });                                    
        (error: any) => { 
            console.log(error); 
            console.log('Remove Cart Failed'); 
        }        
    }
/*
remove(productInOrder: ProductInOrder): void {
        this.cartService.remove(productInOrder).subscribe?(
            success => {
               this.productInOrders = this.productInOrders.filter(e => e.productId !== productInOrder.productId);
                console.log('Cart: ' + this.productInOrders);
            },
            _ => console.log('Remove Cart Failed'))
    }*/

    checkout(): void {
        if (!this.currentUser) {
            this.router.navigate(['/login'], {queryParams: {returnUrl: this.router.url}});
        } else if (this.currentUser.role !== Role.Customer) {
            this.router.navigate(['/seller']);
        } else {
            this.cartService.checkout().subscribe!( { next: (data: any) => this.productInOrders = [], error: (e: any) =>  console.log('Checkout Cart Failed')});                              
            this.router.navigate(['/']);
        }
    }
    /*
function success() {
    throw new Error('Function not implemented.');
}*/

}

