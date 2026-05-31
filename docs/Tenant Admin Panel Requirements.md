## Tenant Admin Panel Requirements

The Tenant Admin panel will be used by each business owner or authorised business admin to manage their own POS, inventory, users, branches, products, purchases, sales, customers, suppliers, expenses, reports, settings, and integrations.

The Tenant Admin can only manage data under their own tenant/business account. They will not have access to other tenant data or Super Admin-level SaaS settings.

---

# 1. Tenant Admin Dashboard

The dashboard will provide a complete business overview for the tenant.

## Features

* View today’s sales
* View today’s purchase
* View today’s profit
* View total revenue
* View total expenses
* View total due amount
* View total customers
* View total suppliers
* View total products
* View low stock products
* View out-of-stock products
* View recent sales
* View recent purchases
* View recent payments
* View sales chart
* View purchase chart
* View profit chart
* View branch-wise performance
* View top-selling products
* View slow-moving products
* View subscription status
* View system notifications

---

# 2. Business Profile Management

The Tenant Admin can manage the company/business profile.

## CRUD Features

### Create / Setup Business Profile

* Add business name
* Add business logo
* Add business owner name
* Add business phone number
* Add business email
* Add business address
* Add tax/VAT registration number
* Add business type
* Add invoice prefix
* Add default currency
* Add default timezone

### View Business Profile

* View company information
* View owner information
* View business contact details
* View subscription package
* View current business settings

### Update Business Profile

* Edit business name
* Edit logo
* Edit contact details
* Edit business address
* Update invoice settings
* Update tax/VAT information
* Update default currency
* Update timezone

### Delete / Disable Business Profile

* Tenant Admin cannot permanently delete the business account
* Tenant Admin may request account deletion
* Super Admin approval is required for permanent tenant deletion

---

# 3. Branch Management

The Tenant Admin can manage one or multiple business branches based on the subscription package.

## CRUD Features

### Create Branch

* Add branch name
* Add branch code
* Add branch address
* Add contact person
* Add phone number
* Add email
* Set opening balance
* Assign branch manager
* Set branch status

### View Branch

* View all branches
* View branch details
* View branch users
* View branch stock
* View branch sales
* View branch purchases
* View branch expenses
* View branch performance report

### Update Branch

* Edit branch name
* Edit branch address
* Edit contact details
* Change branch manager
* Update branch status
* Update branch settings

### Delete Branch

* Soft delete branch
* Prevent deletion if branch has sales, purchases, or stock history
* Archive inactive branch
* Restore deleted branch if allowed

---

# 4. User Management

The Tenant Admin can manage business users and staff.

## CRUD Features

### Create User

* Add user name
* Add email
* Add phone number
* Set password
* Assign role
* Assign branch
* Set user status
* Upload profile image
* Set access permissions

### View User

* View all users
* View user profile
* View assigned role
* View assigned branch
* View login history
* View activity history
* View sales handled by user

### Update User

* Edit user information
* Change role
* Change assigned branch
* Reset password
* Activate user
* Deactivate user
* Update profile image
* Update permission access

### Delete User

* Soft delete user
* Prevent deletion if user is linked with sales or purchase records
* Deactivate user instead of permanent deletion
* Restore deleted user

---

# 5. Roles & Permissions Management

The Tenant Admin can create custom roles and assign module-wise permissions.

## CRUD Features

### Create Role

* Add role name
* Add role description
* Select module permissions
* Select action permissions
* Assign branch-wise access
* Set role status

### View Role

* View all roles
* View role details
* View assigned users
* View assigned permissions

### Update Role

* Edit role name
* Edit role description
* Update permissions
* Activate role
* Deactivate role

### Delete Role

* Delete unused role
* Prevent deletion if users are assigned
* Reassign users before deleting role

## Example Permissions

* Dashboard access
* POS access
* Create sale
* Edit sale
* Delete sale
* View sales report
* Manage products
* Manage purchases
* Manage customers
* Manage suppliers
* Manage expenses
* Manage users
* Manage roles
* Manage settings
* Export reports
* Approve stock adjustment
* Approve returns

---

# 6. POS & Billing Management

The POS module will allow fast billing, invoice generation, payment collection, and stock deduction.

## CRUD / Action Features

### Create Sale from POS

* Search product by name, SKU, barcode, or category
* Add product to cart
* Update quantity
* Apply item discount
* Apply invoice discount
* Apply tax/VAT
* Select customer
* Create walk-in customer sale
* Select payment method
* Accept full payment
* Accept partial payment
* Create due sale
* Generate invoice
* Print receipt
* Hold sale
* Resume sale

### View POS Sales

* View today’s POS sales
* View held sales
* View completed sales
* View due sales
* View cashier-wise sales
* View branch-wise POS transactions

### Update POS Sale

* Edit held sale
* Update cart before payment
* Update customer before invoice completion
* Update payment details if permission is allowed
* Update due payment status

### Delete / Cancel POS Sale

* Cancel held sale
* Void invoice with permission
* Delete draft sale
* Keep cancellation log
* Require reason for sale cancellation

## Additional POS Features

* Barcode scanner support
* Thermal printer support
* A4 invoice print
* Cash drawer support in future
* Split payment
* Multiple payment methods
* Quick product buttons
* Product image view
* Customer due alert
* Low stock warning during sale

---

# 7. Product Management

The Tenant Admin can fully manage product records.

## CRUD Features

### Create Product

* Add product name
* Add SKU
* Add barcode
* Select category
* Select brand
* Select unit
* Add product image
* Add purchase price
* Add selling price
* Add wholesale price
* Add tax/VAT
* Add discount
* Add opening stock
* Add reorder level
* Add expiry date if applicable
* Add batch number if applicable
* Add serial number if applicable
* Set product status

### View Product

* View all products
* View product details
* View current stock
* View branch-wise stock
* View purchase history
* View sales history
* View stock movement history
* View product profit
* View product image
* View low stock products
* View expired products

### Update Product

* Edit product name
* Edit SKU
* Edit barcode
* Update category
* Update brand
* Update unit
* Update price
* Update tax/VAT
* Update discount
* Update reorder level
* Update product image
* Activate or deactivate product

### Delete Product

* Soft delete product
* Prevent deletion if product has sales or purchase history
* Archive product
* Restore deleted product

---

# 8. Category Management

The Tenant Admin can manage product categories.

## CRUD Features

### Create Category

* Add category name
* Add category code
* Add parent category
* Add category image
* Set status

### View Category

* View all categories
* View category-wise products
* View active and inactive categories

### Update Category

* Edit category name
* Edit category code
* Change parent category
* Update image
* Activate or deactivate category

### Delete Category

* Delete unused category
* Prevent deletion if products are assigned
* Move products to another category before deletion

---

# 9. Brand Management

The Tenant Admin can manage product brands.

## CRUD Features

### Create Brand

* Add brand name
* Add brand logo
* Add brand description
* Set status

### View Brand

* View all brands
* View brand-wise products
* View active and inactive brands

### Update Brand

* Edit brand name
* Update logo
* Update description
* Activate or deactivate brand

### Delete Brand

* Delete unused brand
* Prevent deletion if products are assigned
* Move products to another brand before deletion

---

# 10. Unit Management

The Tenant Admin can manage product units.

## CRUD Features

### Create Unit

* Add unit name
* Add short name
* Add unit type
* Set status

### View Unit

* View all units
* View unit-wise products
* View active and inactive units

### Update Unit

* Edit unit name
* Edit short name
* Update status

### Delete Unit

* Delete unused unit
* Prevent deletion if products are assigned

## Example Units

* Piece
* Kilogram
* Gram
* Litre
* Millilitre
* Box
* Packet
* Dozen
* Meter

---

# 11. Stock Management

The Tenant Admin can manage stock, stock movement, adjustment, and transfer.

## CRUD / Action Features

### Create Stock Entry

* Add opening stock
* Add purchase stock
* Add stock adjustment
* Add damaged stock
* Add expired stock
* Add returned stock
* Add branch stock

### View Stock

* View current stock
* View branch-wise stock
* View product-wise stock
* View low stock
* View out-of-stock
* View expired stock
* View damaged stock
* View stock movement history
* View inventory valuation

### Update Stock

* Adjust stock quantity
* Update reorder level
* Update batch stock
* Update expiry stock
* Correct stock entry with permission
* Approve or reject stock adjustment

### Delete / Reverse Stock Entry

* Reverse incorrect stock adjustment
* Delete draft stock entry
* Keep stock deletion log
* Require reason for stock correction

## Stock Transfer Features

* Transfer stock from one branch to another
* Create transfer request
* Approve transfer
* Reject transfer
* Receive transferred stock
* View transfer history
* Print transfer note

---

# 12. Purchase Management

The Tenant Admin can manage supplier purchases and stock receiving.

## CRUD Features

### Create Purchase

* Select supplier
* Add purchase date
* Add purchase invoice number
* Add products
* Add quantity
* Add purchase price
* Add discount
* Add tax/VAT
* Add shipping cost
* Add payment amount
* Select payment method
* Save as draft
* Save as completed
* Auto-increase stock after approval

### View Purchase

* View all purchases
* View purchase details
* View supplier-wise purchases
* View branch-wise purchases
* View paid purchases
* View due purchases
* View partial paid purchases
* View purchase items
* View purchase invoice

### Update Purchase

* Edit draft purchase
* Update supplier
* Update products
* Update quantity
* Update purchase price
* Update payment amount
* Update payment status
* Approve purchase
* Update purchase note

### Delete Purchase

* Delete draft purchase
* Cancel purchase with reason
* Reverse stock if purchase is cancelled
* Prevent deletion if already used in stock or payment reports
* Keep purchase cancellation log

---

# 13. Purchase Return Management

The Tenant Admin can manage returns to suppliers.

## CRUD Features

### Create Purchase Return

* Select purchase invoice
* Select return product
* Add return quantity
* Add return reason
* Add refund amount
* Adjust supplier balance
* Reduce stock automatically

### View Purchase Return

* View all purchase returns
* View supplier-wise returns
* View product-wise returns
* View refund status

### Update Purchase Return

* Edit draft return
* Update return quantity
* Update refund amount
* Update return status

### Delete Purchase Return

* Delete draft return
* Cancel return with reason
* Restore stock if return is cancelled

---

# 14. Sales Management

The Tenant Admin can manage all sales records.

## CRUD Features

### Create Sale

* Create sale from POS
* Create manual sale
* Select customer
* Add products
* Add quantity
* Add selling price
* Add discount
* Add tax/VAT
* Add payment
* Generate invoice
* Reduce stock automatically

### View Sale

* View all sales
* View sale details
* View customer-wise sales
* View branch-wise sales
* View user-wise sales
* View paid sales
* View due sales
* View partial paid sales
* View invoice

### Update Sale

* Edit draft sale
* Update payment status
* Add due payment
* Update customer information
* Update delivery status if applicable
* Update invoice note

### Delete / Cancel Sale

* Delete draft sale
* Cancel invoice with permission
* Restore stock if sale is cancelled
* Require cancellation reason
* Keep cancelled invoice log

---

# 15. Sales Return & Refund Management

The Tenant Admin can manage customer returns and refunds.

## CRUD Features

### Create Sales Return

* Select sales invoice
* Select returned product
* Add return quantity
* Add return reason
* Add refund amount
* Add exchange product if needed
* Update customer balance
* Increase stock automatically if product is reusable

### View Sales Return

* View all sales returns
* View customer-wise returns
* View product-wise returns
* View refund status
* View return reason

### Update Sales Return

* Edit draft return
* Update return quantity
* Update refund amount
* Update return status
* Approve or reject return

### Delete Sales Return

* Delete draft return
* Cancel return with reason
* Reverse stock effect if return is cancelled

---

# 16. Customer Management

The Tenant Admin can manage customer records, due balances, and statements.

## CRUD Features

### Create Customer

* Add customer name
* Add phone number
* Add email
* Add address
* Add customer group
* Add opening balance
* Add credit limit
* Add date of birth if required
* Set customer status

### View Customer

* View all customers
* View customer profile
* View customer sales history
* View customer due balance
* View customer payment history
* View customer return history
* View customer statement

### Update Customer

* Edit customer information
* Update address
* Update phone number
* Update credit limit
* Update opening balance
* Activate or deactivate customer

### Delete Customer

* Soft delete customer
* Prevent deletion if customer has sales history
* Archive customer
* Restore deleted customer

## Additional Customer Features

* Customer group management
* Loyalty points in future
* Customer due reminder
* Customer statement print
* Customer import/export

---

# 17. Supplier Management

The Tenant Admin can manage supplier records, purchases, dues, and statements.

## CRUD Features

### Create Supplier

* Add supplier name
* Add company name
* Add phone number
* Add email
* Add address
* Add opening balance
* Add payment terms
* Set supplier status

### View Supplier

* View all suppliers
* View supplier profile
* View supplier purchase history
* View supplier due balance
* View supplier payment history
* View supplier return history
* View supplier statement

### Update Supplier

* Edit supplier information
* Update company name
* Update contact details
* Update payment terms
* Update opening balance
* Activate or deactivate supplier

### Delete Supplier

* Soft delete supplier
* Prevent deletion if supplier has purchase history
* Archive supplier
* Restore deleted supplier

---

# 18. Expense Management

The Tenant Admin can manage business expenses.

## CRUD Features

### Create Expense

* Select expense category
* Add expense title
* Add expense amount
* Add expense date
* Select payment method
* Select branch
* Add note
* Upload attachment

### View Expense

* View all expenses
* View expense details
* View branch-wise expenses
* View category-wise expenses
* View date-wise expenses
* View monthly expense report

### Update Expense

* Edit expense title
* Edit amount
* Update category
* Update payment method
* Update note
* Update attachment

### Delete Expense

* Delete incorrect expense
* Archive expense
* Restore deleted expense
* Keep expense deletion log

---

# 19. Expense Category Management

The Tenant Admin can manage expense categories.

## CRUD Features

### Create Expense Category

* Add category name
* Add description
* Set status

### View Expense Category

* View all categories
* View category-wise expense amount

### Update Expense Category

* Edit category name
* Edit description
* Activate or deactivate category

### Delete Expense Category

* Delete unused category
* Prevent deletion if expenses are assigned

---

# 20. Payment Management

The Tenant Admin can manage sales collections, supplier payments, and due payments.

## CRUD / Action Features

### Create Payment

* Receive customer payment
* Add supplier payment
* Add partial payment
* Add due payment
* Select payment method
* Add transaction reference
* Upload payment proof if needed

### View Payment

* View all payments
* View customer payments
* View supplier payments
* View due collections
* View payment method-wise report
* View branch-wise payment report

### Update Payment

* Edit payment note
* Update transaction reference
* Correct payment method with permission
* Update payment status

### Delete / Reverse Payment

* Reverse incorrect payment
* Delete draft payment
* Require reason for payment reversal
* Keep payment log

---

# 21. Reports & Analytics

The Tenant Admin can view and export business reports.

## Report Features

* Sales report
* Purchase report
* Product report
* Stock report
* Low stock report
* Out-of-stock report
* Expired product report
* Damaged stock report
* Stock movement report
* Customer due report
* Supplier due report
* Expense report
* Profit and loss report
* Tax/VAT report
* Payment report
* Sales return report
* Purchase return report
* Branch-wise report
* User-wise report
* Top-selling product report
* Slow-moving product report
* Inventory valuation report
* Daily closing report

## Report Actions

* View report
* Filter by date
* Filter by branch
* Filter by user
* Filter by customer
* Filter by supplier
* Filter by product
* Export to PDF
* Export to Excel
* Print report

---

# 22. Barcode & Label Management

The Tenant Admin can manage barcode generation and printing.

## Features

* Generate barcode for product
* Print single barcode
* Print bulk barcode
* Select barcode label size
* Set barcode format
* Print product labels
* Include price on label
* Include product name on label
* Include SKU on label

---

# 23. Tax / VAT Management

The Tenant Admin can configure tax/VAT settings.

## CRUD Features

### Create Tax

* Add tax name
* Add tax percentage
* Add tax type
* Set status

### View Tax

* View all taxes
* View product-wise tax
* View invoice-wise tax
* View tax report

### Update Tax

* Edit tax name
* Edit percentage
* Activate or deactivate tax

### Delete Tax

* Delete unused tax
* Prevent deletion if tax is used in invoices

---

# 24. Invoice & Receipt Settings

The Tenant Admin can configure invoice and receipt formats.

## Features

* Set invoice prefix
* Set invoice number format
* Add business logo
* Add invoice footer text
* Add terms and conditions
* Select thermal receipt layout
* Select A4 invoice layout
* Show or hide tax
* Show or hide discount
* Show or hide customer due
* Set default print format
* Preview invoice template

---

# 25. E-commerce Integration

The Tenant Admin can connect the POS inventory with an online store.

## CRUD / Integration Features

### Create Integration

* Connect WooCommerce store
* Connect Shopify store in future
* Add API credentials
* Add store URL
* Select sync direction
* Configure product sync
* Configure stock sync
* Configure order sync

### View Integration

* View connected stores
* View sync status
* View last sync time
* View synced products
* View online orders
* View failed sync logs

### Update Integration

* Update API credentials
* Change sync settings
* Enable or disable product sync
* Enable or disable stock sync
* Enable or disable order sync
* Update webhook settings

### Delete Integration

* Disconnect store
* Remove API credentials
* Stop sync
* Archive sync history

## E-commerce Sync Features

* Product sync
* Stock sync
* Customer sync
* Order sync
* Online payment status sync
* Online order invoice generation
* Online order stock deduction
* Sync error log

---

# 26. Subscription Details

The Tenant Admin can view and manage subscription-related information within allowed limits.

## Features

* View current package
* View package features
* View package limits
* View subscription start date
* View subscription expiry date
* View billing cycle
* View payment history
* View subscription invoices
* Download invoice
* Request package upgrade
* Request package downgrade
* Renew subscription
* View usage limits
* View user limit
* View branch limit
* View product limit
* View storage limit

## Restricted Actions

* Tenant Admin cannot create packages
* Tenant Admin cannot delete subscriptions
* Tenant Admin cannot change package price
* Package changes may require Super Admin approval or payment confirmation

---

# 27. Notification Management

The Tenant Admin can manage tenant-level notifications.

## Features

* View system notifications
* View low stock alerts
* View subscription expiry alerts
* View customer due alerts
* View supplier due alerts
* View purchase due alerts
* View sales return alerts
* Mark notification as read
* Mark all as read
* Delete notification
* Configure email notification preferences

---

# 28. Activity Log

The Tenant Admin can view important business activity logs.

## Features

* View user login logs
* View product update logs
* View sales logs
* View purchase logs
* View payment logs
* View stock adjustment logs
* View stock transfer logs
* View role permission change logs
* View settings change logs
* Filter logs by user
* Filter logs by module
* Filter logs by date
* Export logs

---

# 29. Import & Export Management

The Tenant Admin can import and export business data.

## Features

* Import products
* Import customers
* Import suppliers
* Import opening stock
* Export products
* Export customers
* Export suppliers
* Export sales
* Export purchases
* Export stock report
* Download sample import file
* Validate import data
* Show import error report

---

# 30. File & Document Management

The Tenant Admin can manage uploaded files and documents.

## Features

* Upload product images
* Upload expense attachments
* Upload purchase invoices
* Upload payment proof
* View uploaded files
* Delete unused files
* Monitor storage usage
* View storage limit based on package

---

# 31. Tenant Settings

The Tenant Admin can manage business-level settings.

## Settings Features

* Business profile settings
* Branch settings
* POS settings
* Invoice settings
* Receipt settings
* Tax/VAT settings
* Currency settings
* Timezone settings
* Date format settings
* Payment method settings
* Notification settings
* Barcode settings
* Stock settings
* Low stock alert settings
* Return policy settings
* User access settings

---

# 32. Security Settings

The Tenant Admin can manage security settings for tenant users.

## Features

* Change password
* Force password reset for users
* Enable two-factor authentication in future
* View login history
* Manage session timeout
* Block inactive users
* Control user access by role
* Control user access by branch
* View failed login attempts

---

# 33. Tenant Admin Full CRUD Summary

| Module                 | Create        | View        | Update          | Delete              |
| ---------------------- | ------------- | ----------- | --------------- | ------------------- |
| Business Profile       | Setup         | Yes         | Yes             | Request only        |
| Branches               | Yes           | Yes         | Yes             | Soft delete         |
| Users                  | Yes           | Yes         | Yes             | Soft delete         |
| Roles                  | Yes           | Yes         | Yes             | Yes                 |
| Permissions            | Yes           | Yes         | Yes             | Yes                 |
| POS Sales              | Yes           | Yes         | Limited         | Cancel/Void         |
| Products               | Yes           | Yes         | Yes             | Soft delete         |
| Categories             | Yes           | Yes         | Yes             | Yes                 |
| Brands                 | Yes           | Yes         | Yes             | Yes                 |
| Units                  | Yes           | Yes         | Yes             | Yes                 |
| Stock Entries          | Yes           | Yes         | Adjustment      | Reverse             |
| Stock Transfers        | Yes           | Yes         | Approve/Receive | Cancel              |
| Purchases              | Yes           | Yes         | Yes             | Cancel/Delete Draft |
| Purchase Returns       | Yes           | Yes         | Yes             | Cancel/Delete Draft |
| Sales                  | Yes           | Yes         | Limited         | Cancel/Delete Draft |
| Sales Returns          | Yes           | Yes         | Yes             | Cancel/Delete Draft |
| Customers              | Yes           | Yes         | Yes             | Soft delete         |
| Suppliers              | Yes           | Yes         | Yes             | Soft delete         |
| Expenses               | Yes           | Yes         | Yes             | Yes                 |
| Expense Categories     | Yes           | Yes         | Yes             | Yes                 |
| Payments               | Yes           | Yes         | Limited         | Reverse             |
| Reports                | No            | Yes         | No              | Export only         |
| Barcode Labels         | Yes           | Yes         | Yes             | Yes                 |
| Tax/VAT                | Yes           | Yes         | Yes             | Yes                 |
| Invoice Settings       | Yes           | Yes         | Yes             | No                  |
| E-commerce Integration | Yes           | Yes         | Yes             | Disconnect          |
| Notifications          | No            | Yes         | Mark Read       | Delete              |
| Activity Logs          | No            | Yes         | No              | Export only         |
| Import/Export          | Import        | Export/View | No              | No                  |
| Files/Documents        | Upload        | Yes         | Replace         | Delete              |
| Settings               | Setup         | Yes         | Yes             | No                  |
| Subscription Details   | Request/Renew | Yes         | Limited         | No                  |

---

# 34. Recommended Tenant Admin Menu Structure

The Tenant Admin panel can include the following menus:

1. Dashboard
2. POS
3. Sales
4. Sales Return
5. Purchases
6. Purchase Return
7. Products
8. Categories
9. Brands
10. Units
11. Stock Management
12. Stock Transfer
13. Customers
14. Suppliers
15. Expenses
16. Payments
17. Reports
18. Barcode & Labels
19. Branches
20. Users
21. Roles & Permissions
22. E-commerce Integration
23. Notifications
24. Activity Logs
25. Import & Export
26. Subscription Details
27. Settings

---

# 35. Important Tenant Admin Rules

* Tenant Admin can only access their own business data.
* Tenant Admin cannot access other tenant databases.
* Tenant Admin cannot create or edit SaaS packages.
* Tenant Admin cannot change subscription pricing.
* Tenant Admin cannot bypass package limits.
* Tenant Admin cannot permanently delete tenant database.
* All important delete, cancel, refund, and stock adjustment actions should be logged.
* Sales and purchase records should not be permanently deleted after completion.
* Completed invoices should be cancelled or voided with reason instead of direct deletion.
* Stock changes should always create stock movement history.
* Role permissions should control all sensitive actions.
