import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const db = new Database("database.sqlite");

// Encryption setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-secret-key-32-chars-long!!"; // Must be 32 chars for aes-256-cbc
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Database initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    base_value REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    gov_password TEXT, -- Encrypted
    status TEXT DEFAULT 'Pendente', -- 'Pendente', 'Em Preenchimento', 'Entregue', 'Malha Fina', 'Processada'
    payment_status TEXT DEFAULT 'Pendente', -- 'Pendente', 'Pago'
    service_type_id INTEGER,
    bank_name TEXT,
    bank_agency TEXT,
    bank_account TEXT,
    pix_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(service_type_id) REFERENCES service_types(id)
  );

  -- Insert default service types if none exist
  INSERT OR IGNORE INTO service_types (id, name, base_value) VALUES (1, 'IRPF Simplificado', 150.00);
  INSERT OR IGNORE INTO service_types (id, name, base_value) VALUES (2, 'IRPF Completo', 250.00);
  INSERT OR IGNORE INTO service_types (id, name, base_value) VALUES (3, 'IRPF com Atividade Rural', 450.00);
  INSERT OR IGNORE INTO service_types (id, name, base_value) VALUES (4, 'IRPF com Renda Variável', 350.00);

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    item_name TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    amount REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    method TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`);

// Migration for existing databases
try {
  const columns = db.prepare("PRAGMA table_info(clients)").all() as any[];
  
  const hasServiceTypeId = columns.some(col => col.name === 'service_type_id');
  if (!hasServiceTypeId) {
    db.exec("ALTER TABLE clients ADD COLUMN service_type_id INTEGER REFERENCES service_types(id)");
  }

  const bankColumns = ['bank_name', 'bank_agency', 'bank_account', 'pix_key'];
  bankColumns.forEach(col => {
    if (!columns.some(c => c.name === col)) {
      db.exec(`ALTER TABLE clients ADD COLUMN ${col} TEXT`);
    }
  });
} catch (e) {
  console.error("Migration error:", e);
}

app.use(express.json());

// API Routes
app.get("/api/stats", (req, res) => {
  const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
  const delivered = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'Entregue' OR status = 'Processada'").get() as any;
  const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM clients WHERE payment_status = 'Pendente'").get() as any;
  const malhaFina = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'Malha Fina'").get() as any;

  const recentClients = db.prepare(`
    SELECT id, name, status, created_at 
    FROM clients 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  const serviceDistribution = db.prepare(`
    SELECT st.name, COUNT(c.id) as count
    FROM service_types st
    LEFT JOIN clients c ON st.id = c.service_type_id
    GROUP BY st.id
  `).all();

  const deadlines = db.prepare(`
    SELECT id, name, status, created_at 
    FROM clients 
    WHERE status NOT IN ('Processada', 'Entregue')
    ORDER BY created_at ASC 
    LIMIT 5
  `).all();

  res.json({
    totalClients: totalClients.count,
    delivered: delivered.count,
    pendingPayments: pendingPayments.count,
    malhaFina: malhaFina.count,
    recentClients,
    serviceDistribution,
    deadlines
  });
});

app.get("/api/finance/stats", (req, res) => {
  const totalReceived = db.prepare("SELECT SUM(amount) as total FROM payments").get() as any;
  const pendingClients = db.prepare(`
    SELECT c.id, st.base_value 
    FROM clients c 
    LEFT JOIN service_types st ON c.service_type_id = st.id 
    WHERE c.payment_status = 'Pendente'
  `).all() as any[];
  
  const estimatedPending = pendingClients.reduce((acc, c) => acc + (c.base_value || 250), 0);

  res.json({
    totalReceived: totalReceived.total || 0,
    pendingCount: pendingClients.length,
    estimatedPending: estimatedPending
  });
});

app.get("/api/service-types", (req, res) => {
  const services = db.prepare("SELECT * FROM service_types ORDER BY name ASC").all();
  res.json(services);
});

app.post("/api/service-types", (req, res) => {
  const { name, base_value } = req.body;
  try {
    const info = db.prepare("INSERT INTO service_types (name, base_value) VALUES (?, ?)")
      .run(name, base_value);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/service-types/:id", (req, res) => {
  const { name, base_value } = req.body;
  try {
    if (name && base_value !== undefined) {
      db.prepare("UPDATE service_types SET name = ?, base_value = ? WHERE id = ?")
        .run(name, base_value, req.params.id);
    } else if (name) {
      db.prepare("UPDATE service_types SET name = ? WHERE id = ?")
        .run(name, req.params.id);
    } else if (base_value !== undefined) {
      db.prepare("UPDATE service_types SET base_value = ? WHERE id = ?")
        .run(base_value, req.params.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/service-types/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM service_types WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/payments", (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, c.name as client_name 
    FROM payments p 
    JOIN clients c ON p.client_id = c.id 
    ORDER BY p.date DESC
  `).all();
  res.json(payments);
});

app.get("/api/clients", (req, res) => {
  const clients = db.prepare("SELECT id, name, cpf, status, payment_status FROM clients ORDER BY name ASC").all();
  res.json(clients);
});

app.post("/api/clients", (req, res) => {
  const { name, cpf, email, phone, gov_password, service_type_id, bank_name, bank_agency, bank_account, pix_key } = req.body;
  try {
    const encryptedPassword = gov_password ? encrypt(gov_password) : null;
    const info = db.prepare(`
      INSERT INTO clients (name, cpf, email, phone, gov_password, service_type_id, bank_name, bank_agency, bank_account, pix_key) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, cpf, email, phone, encryptedPassword, service_type_id, bank_name, bank_agency, bank_account, pix_key);
    
    // Create default checklist
    const clientId = info.lastInsertRowid;
    const defaultItems = ["RG/CPF", "Comprovante de Residência", "Informe de Rendimentos", "Extratos Bancários", "Recibos Médicos/Educação"];
    const insertChecklist = db.prepare("INSERT INTO checklist_items (client_id, item_name) VALUES (?, ?)");
    for (const item of defaultItems) {
      insertChecklist.run(clientId, item);
    }

    res.json({ id: clientId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clients/:id", (req, res) => {
  const client = db.prepare(`
    SELECT c.*, st.name as service_name, st.base_value as service_value 
    FROM clients c 
    LEFT JOIN service_types st ON c.service_type_id = st.id 
    WHERE c.id = ?
  `).get(req.params.id) as any;
  if (!client) return res.status(404).json({ error: "Client not found" });
  
  // Mask password but allow decryption for authorized view (simulated)
  if (client.gov_password) {
    client.has_password = true;
    delete client.gov_password; // Don't send encrypted string to client by default
  }

  const checklist = db.prepare("SELECT * FROM checklist_items WHERE client_id = ?").all(req.params.id);
  const payments = db.prepare("SELECT * FROM payments WHERE client_id = ?").all(req.params.id);

  res.json({ ...client, checklist, payments });
});

app.get("/api/clients/:id/password", (req, res) => {
  const client = db.prepare("SELECT gov_password FROM clients WHERE id = ?").get(req.params.id) as any;
  if (!client || !client.gov_password) return res.status(404).json({ error: "Password not found" });
  res.json({ password: decrypt(client.gov_password) });
});

app.patch("/api/clients/:id", (req, res) => {
  const { 
    status, 
    payment_status, 
    name, 
    cpf, 
    email, 
    phone, 
    gov_password, 
    service_type_id,
    bank_name,
    bank_agency,
    bank_account,
    pix_key
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (payment_status !== undefined) { updates.push("payment_status = ?"); params.push(payment_status); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (cpf !== undefined) { updates.push("cpf = ?"); params.push(cpf); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (gov_password !== undefined) { 
      updates.push("gov_password = ?"); 
      params.push(gov_password ? encrypt(gov_password) : null); 
    }
    if (service_type_id !== undefined) { updates.push("service_type_id = ?"); params.push(service_type_id); }
    if (bank_name !== undefined) { updates.push("bank_name = ?"); params.push(bank_name); }
    if (bank_agency !== undefined) { updates.push("bank_agency = ?"); params.push(bank_agency); }
    if (bank_account !== undefined) { updates.push("bank_account = ?"); params.push(bank_account); }
    if (pix_key !== undefined) { updates.push("pix_key = ?"); params.push(pix_key); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE clients SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/clients/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/clients/:id/checklist", (req, res) => {
  const { item_id, is_completed } = req.body;
  db.prepare("UPDATE checklist_items SET is_completed = ? WHERE id = ? AND client_id = ?")
    .run(is_completed ? 1 : 0, item_id, req.params.id);
  res.json({ success: true });
});

app.post("/api/clients/:id/payments", (req, res) => {
  const { amount, method } = req.body;
  db.prepare("INSERT INTO payments (client_id, amount, method) VALUES (?, ?, ?)")
    .run(req.params.id, amount, method);
  db.prepare("UPDATE clients SET payment_status = 'Pago' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
