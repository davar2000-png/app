const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Database initialization
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'technokala.db');
  db = new Database(dbPath);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    -- Persons table
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- customer, supplier, guarantor, employee, other
      name TEXT NOT NULL,
      family_name TEXT,
      national_id TEXT,
      job TEXT,
      employee_id TEXT,
      phone TEXT,
      mobile TEXT,
      bank_card TEXT,
      address TEXT,
      image TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Person documents
    CREATE TABLE IF NOT EXISTS person_documents (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES persons(id)
    );

    -- Product categories
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Product brands
    CREATE TABLE IF NOT EXISTS product_brands (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id)
    );

    -- Product models
    CREATE TABLE IF NOT EXISTS product_models (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES product_brands(id)
    );

    -- Product colors
    CREATE TABLE IF NOT EXISTS product_colors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT,
      brand_id TEXT,
      model_id TEXT,
      color TEXT,
      ram TEXT,
      storage TEXT,
      buy_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      min_stock INTEGER DEFAULT 0,
      reorder_point INTEGER DEFAULT 0,
      allow_negative_stock INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id),
      FOREIGN KEY (brand_id) REFERENCES product_brands(id),
      FOREIGN KEY (model_id) REFERENCES product_models(id)
    );

    -- Product items (Serial-based)
    CREATE TABLE IF NOT EXISTS product_items (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      purchase_price INTEGER NOT NULL,
      purchase_invoice_id TEXT,
      status TEXT DEFAULT 'in_stock', -- in_stock, sold, returned
      sold_invoice_id TEXT,
      sold_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Purchase invoices
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      supplier_id TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER DEFAULT 0,
      remaining_amount INTEGER NOT NULL,
      payment_type TEXT, -- cash, installment, mixed
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES persons(id)
    );

    -- Purchase invoice items
    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_item_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (product_item_id) REFERENCES product_items(id)
    );

    -- Sales invoices
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER DEFAULT 0,
      remaining_amount INTEGER NOT NULL,
      payment_type TEXT, -- cash, installment, mixed
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES persons(id)
    );

    -- Sales invoice items
    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_item_id TEXT,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      profit INTEGER,
      FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (product_item_id) REFERENCES product_items(id)
    );

    -- Installments
    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      invoice_type TEXT NOT NULL, -- purchase, sale
      amount INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      paid_amount INTEGER DEFAULT 0,
      remaining_amount INTEGER NOT NULL,
      paid_date TEXT,
      status TEXT DEFAULT 'pending', -- pending, paid, overdue
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
    );

    -- Cheques
    CREATE TABLE IF NOT EXISTS cheques (
      id TEXT PRIMARY KEY,
      cheque_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      issuer_name TEXT,
      issuer_national_id TEXT,
      due_date TEXT NOT NULL,
      type TEXT NOT NULL, -- received, paid
      status TEXT DEFAULT 'pending', -- pending, cashed, bounced, cancelled
      related_invoice_id TEXT,
      related_person_id TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Banks
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_number TEXT,
      card_number TEXT,
      balance INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Bank transactions
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      type TEXT NOT NULL, -- deposit, withdrawal, transfer
      amount INTEGER NOT NULL,
      description TEXT,
      related_cheque_id TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bank_id) REFERENCES banks(id)
    );

    -- Accounting entries (Double-entry)
    CREATE TABLE IF NOT EXISTS accounting_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT,
      related_entity_type TEXT, -- invoice, cheque, payment, etc.
      related_entity_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Accounting entry items
    CREATE TABLE IF NOT EXISTS accounting_entry_items (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL,
      debit INTEGER DEFAULT 0,
      credit INTEGER DEFAULT 0,
      description TEXT,
      FOREIGN KEY (entry_id) REFERENCES accounting_entries(id)
    );

    -- Audit log
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_name TEXT DEFAULT 'System',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized successfully');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'TechnoKala Accounting System'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('db:query', (event, sql, params) => {
  try {
    return db.prepare(sql).all(...(params || []));
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
});

ipcMain.handle('db:run', (event, sql, params) => {
  try {
    const result = db.prepare(sql).run(...(params || []));
    return result;
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
});

ipcMain.handle('db:transaction', (event, queries) => {
  try {
    const transaction = db.transaction((queries) => {
      for (const query of queries) {
        if (query.type === 'run') {
          db.prepare(query.sql).run(...(query.params || []));
        } else if (query.type === 'get') {
          db.prepare(query.sql).get(...(query.params || []));
        } else if (query.type === 'all') {
          db.prepare(query.sql).all(...(query.params || []));
        }
      }
    });
    transaction(queries);
    return { success: true };
  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
});

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});
