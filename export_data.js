const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('dev.db', { readonly: true });
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'`).all();

let sql = '';

for (const { name: table } of tables) {
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    if (rows.length === 0) continue;

    for (const row of rows) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
        const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'number') return v;
            if (typeof v === 'boolean') return v ? 1 : 0;
            return typeof v;
        }).join(', ');
        sql += `INSERT INTO "${table}" (${columns}) VALUES (${values});\n`;
    }
}

fs.writeFileSync('data.sql', sql, 'utf8');
console.log('Exported ' + tables.length + ' tables to data.sql');
