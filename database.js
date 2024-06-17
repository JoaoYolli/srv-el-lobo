const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the chinook database.');
  });

  // Crear una tabla si no existe
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        correo TEXT PRIMARY KEY,
        apodo CHAR(20)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Tabla creada exitosamente o ya existía.');
        }
    });
});

db.serialize(() => {
    // Insertar un usuario
    // db.run(`INSERT INTO usuarios (correo, apodo) VALUES (?, ?)`, ['yoaojoao@gmail.com', 'desarrollador'], function(err) {
    //     if (err) {
    //         return console.error(err.message);
    //     }
    //     console.log(`Un usuario ha sido insertado con el correo ${this.lastID}`);
    // });

    // Seleccionar todos los datos de la tabla
    db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log("Linea",row);
        });
    });
});

closeDB(db)

function closeDB(db){
    db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Close the database connection.');
      });
}