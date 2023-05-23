import {AfterContentChecked, Component, OnInit} from '@angular/core';
import {ProductInfo} from "../../models/productInfo";
import {ProductService} from "../../services/product.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html',
    styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit, AfterContentChecked {

    product = new ProductInfo() as any;
    /*invalid!: HTMLInputElement;
    touched!: HTMLInputElement;*/
    constructor(private productService: ProductService,
                private route: ActivatedRoute,
                private router: Router) {
    }

    productId: string | undefined;
    isEdit = false; 
    
    ngOnInit() {
        //const { this.invalid, this.touched } = event?.target as HTMLInputElement;
        this.productId = this.route.snapshot.paramMap.get('id')!;
        if (this.productId) {
            this.isEdit = true;
            this.productService.getDetail(this.productId).subscribe(prod => this.product = prod);
        }
    }

    update() {
        this.productService.update(this.product).subscribe( { next: (prod: any) => {
            if (!prod) throw new Error(),
            this.router.navigate(['/seller'])},            
            error: (e: any)=> console.log(e) });              
    }

    onSubmit() {
        if (this.productId) {
            this.update();
        } else {
            this.add();
        }
    }

    add() {
        this.productService.create(this.product).subscribe({ next: (prod: any) => /*if (!prod) {throw new Error};*/
            this.router.navigate(['/']),                       
            error: (e: any) =>{throw new Error}});
        }           

    ngAfterContentChecked(): void {
        console.log(this.product);
    }
}
