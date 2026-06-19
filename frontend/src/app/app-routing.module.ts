import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ProductListComponent } from './features/products/product-list.component'
import { ProductDetailsComponent } from './features/products/product-details.component'
import { CartComponent } from './features/cart/cart.component'
import { CheckoutComponent } from './features/checkout/checkout.component'
import { AuthGuard } from './core/guards/auth.guard'
import { LoginComponent } from './features/auth/login.component'
import { RegisterComponent } from './features/auth/register.component'
import { OrderConfirmationComponent } from './features/confirmation/order-confirmation.component'
import { ProfileComponent } from './features/profile/profile.component'

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: 'product/:id', redirectTo: 'products/:id' },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'confirmation', component: OrderConfirmationComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
