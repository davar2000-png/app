-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopName" TEXT NOT NULL DEFAULT 'فروشگاه موبایل',
    "shopPhone" TEXT,
    "shopAddress" TEXT,
    "logo" TEXT,
    "defaultInputCurrency" TEXT NOT NULL DEFAULT 'TOMAN',
    "defaultReportCurrency" TEXT NOT NULL DEFAULT 'RIAL',
    "purchaseInvoicePrefix" TEXT NOT NULL DEFAULT 'PUR-',
    "salesInvoicePrefix" TEXT NOT NULL DEFAULT 'SAL-',
    "salesReturnPrefix" TEXT NOT NULL DEFAULT 'SRN-',
    "purchaseReturnPrefix" TEXT NOT NULL DEFAULT 'PRN-',
    "installmentContractPrefix" TEXT NOT NULL DEFAULT 'INS-',
    "checkPrefix" TEXT NOT NULL DEFAULT 'CHK-',
    "promissoryNotePrefix" TEXT NOT NULL DEFAULT 'PNT-',
    "registerMovementPrefix" TEXT NOT NULL DEFAULT 'REG-',
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "enableLateFee" BOOLEAN NOT NULL DEFAULT false,
    "lateFeePercentage" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'MOBILE',
    "brand" TEXT,
    "category" TEXT,
    "modelName" TEXT NOT NULL,
    "color" TEXT,
    "storage" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'NEW',
    "barcode" TEXT,
    "description" TEXT,
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "defaultPurchasePrice" BIGINT NOT NULL,
    "defaultSalePrice" BIGINT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "serialValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "purchaseCost" BIGINT NOT NULL,
    "salePrice" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "purchaseItemId" TEXT,
    "saleItemId" TEXT,
    CONSTRAINT "SerialNumber_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SerialNumber_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SerialNumber_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "nationalId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "nationalId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseInvoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseItem_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNumber" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseReturn_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseReturnItem_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "serialId" TEXT,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_serialId_fkey" FOREIGN KEY ("serialId") REFERENCES "SerialNumber" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "saleDate" DATETIME NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "discountAmount" BIGINT NOT NULL DEFAULT 0,
    "totalAmount" BIGINT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesInvoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "discountAmount" BIGINT NOT NULL DEFAULT 0,
    "totalPrice" BIGINT NOT NULL,
    "costPrice" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNumber" TEXT NOT NULL,
    "salesInvoiceId" TEXT NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleReturn_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "costPrice" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleReturnItem_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "description" TEXT,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "customerId" TEXT,
    "supplierId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentId" TEXT,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "RegisterMovement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallmentContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT NOT NULL,
    "salesInvoiceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "downPayment" BIGINT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "remainingAmount" BIGINT NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "intervalDays" INTEGER,
    "firstDueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallmentContract_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallmentSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" BIGINT NOT NULL,
    "paidAmount" BIGINT NOT NULL DEFAULT 0,
    "remainingAmount" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallmentSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "InstallmentContract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallmentPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstallmentPayment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "InstallmentSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "InstallmentContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInstrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankName" TEXT,
    "dueDate" DATETIME NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "linkedInvoiceId" TEXT,
    "linkedContractId" TEXT,
    "collectedAt" DATETIME,
    "bouncedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "checkMovementId" TEXT,
    CONSTRAINT "CheckInstrument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckInstrument_checkMovementId_fkey" FOREIGN KEY ("checkMovementId") REFERENCES "RegisterMovement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromissoryNoteInstrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "linkedInvoiceId" TEXT,
    "linkedContractId" TEXT,
    "collectedAt" DATETIME,
    "bouncedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "promissoryMovementId" TEXT,
    CONSTRAINT "PromissoryNoteInstrument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PromissoryNoteInstrument_promissoryMovementId_fkey" FOREIGN KEY ("promissoryMovementId") REFERENCES "RegisterMovement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegisterMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "movementNumber" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "movementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "balanceAfter" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryNumber" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "isBalanced" BOOLEAN NOT NULL DEFAULT true,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" BIGINT NOT NULL,
    "credit" BIGINT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_serialValue_key" ON "SerialNumber"("serialValue");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNumber_key" ON "PurchaseInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_returnNumber_key" ON "PurchaseReturn"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_invoiceNumber_key" ON "SalesInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaleReturn_returnNumber_key" ON "SaleReturn"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentContract_contractNumber_key" ON "InstallmentContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInstrument_instrumentNumber_key" ON "CheckInstrument"("instrumentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInstrument_checkMovementId_key" ON "CheckInstrument"("checkMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "PromissoryNoteInstrument_instrumentNumber_key" ON "PromissoryNoteInstrument"("instrumentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PromissoryNoteInstrument_promissoryMovementId_key" ON "PromissoryNoteInstrument"("promissoryMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "RegisterMovement_movementNumber_key" ON "RegisterMovement"("movementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "Account"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Account_category_key" ON "Account"("category");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");
