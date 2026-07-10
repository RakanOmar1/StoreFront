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
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component'
import { AdminTablePageComponent } from './features/admin/admin-table-page.component'
import { AdminCrudPageComponent } from './features/admin/admin-crud-page.component'
import { AdminGuard } from './core/guards/admin.guard'
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard'

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: 'product/:id', redirectTo: 'products/:id' },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'confirmation', component: OrderConfirmationComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], canDeactivate: [UnsavedChangesGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/products', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'products' } },
  { path: 'admin/products/new', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'products', mode: 'create' } },
  { path: 'admin/products/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'products', mode: 'view' } },
  { path: 'admin/products/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'products', mode: 'edit' } },
  { path: 'admin/products/:id/delete', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'products', mode: 'delete' } },
  { path: 'admin/categories', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'categories' } },
  { path: 'admin/categories/new', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'categories', mode: 'create' } },
  { path: 'admin/categories/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'categories', mode: 'view' } },
  { path: 'admin/categories/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'categories', mode: 'edit' } },
  { path: 'admin/categories/:id/delete', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'categories', mode: 'delete' } },
  { path: 'admin/promotions', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'promotions' } },
  { path: 'admin/promotions/new', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'promotions', mode: 'create' } },
  { path: 'admin/promotions/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'promotions', mode: 'view' } },
  { path: 'admin/promotions/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'promotions', mode: 'edit' } },
  { path: 'admin/promotions/:id/delete', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'promotions', mode: 'delete' } },
  { path: 'admin/orders', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'orders' } },
  { path: 'admin/orders/new', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'orders', mode: 'create' } },
  { path: 'admin/orders/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'orders', mode: 'view' } },
  { path: 'admin/orders/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'orders', mode: 'edit' } },
  { path: 'admin/orders/:id/delete', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'orders', mode: 'delete' } },
  { path: 'admin/payments', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'payments' } },
  { path: 'admin/payments/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'payments', mode: 'view' } },
  { path: 'admin/payments/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'payments', mode: 'edit' } },
  { path: 'admin/users', pathMatch: 'full', component: AdminTablePageComponent, canActivate: [AuthGuard, AdminGuard], data: { tableType: 'users' } },
  { path: 'admin/users/new', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'users', mode: 'create' } },
  { path: 'admin/users/:id', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'users', mode: 'view' } },
  { path: 'admin/users/:id/edit', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], canDeactivate: [UnsavedChangesGuard], data: { entity: 'users', mode: 'edit' } },
  { path: 'admin/users/:id/delete', component: AdminCrudPageComponent, canActivate: [AuthGuard, AdminGuard], data: { entity: 'users', mode: 'delete' } },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
