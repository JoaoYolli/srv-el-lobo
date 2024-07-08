const { OPEN_READWRITE, OPEN_FULLMUTEX, OPEN_CREATE } = require('sqlite3');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
async function initializeDB() {
    var dir = '../db';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    let db = await openDatabase()
    db.serialize(() => {
        // Crea la tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS users (
            mail TEXT PRIMARY KEY,
            akka CHAR(20) NOT NULL,
            kills_as_wolf INTEGER NOT NULL,
            wolfs_killed INTEGER NOT NULL,
            UNIQUE (mail, akka)
            )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Tabla creada exitosamente o ya existía.');
            }
        });
        // Insertar un usuario
        // db.run(`INSERT INTO users (mail, akka, kills_as_wolf, wolfs_killed) VALUES (?, ?, ? ,?)`, ['yoaojoao@gmail.com', 'desarrollador', 0, 0], function (err) {
        //     if (err) {
        //         return console.error(err.message);
        //     } else {
        //         console.log(`Un usuario ha sido insertado con el correo ${this.lastID}`);
        //     }
        // });
    });
    closeDB(db)
}
function openDatabase() {
    return new Promise((resolve) => {
        let database = new sqlite3.Database('../db/el-lobo.db', sqlite3.OPEN_READWRITE || OPEN_CREATE, (err) => {
            if (err) {
                console.log("FALLAS")
                console.error(err.message);
                console.log("FALLAS")
            } else {
                console.log('Connected to the wolf database.');
            }
        });
        resolve(database)
    })
}
function closeDB(db) {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}
async function getUserByMail(mail) {
    return new Promise(async (resolve) => {
        let db = await openDatabase()
        // Get usuario
        db.get(`SELECT *
                            FROM users
                            WHERE mail = '${mail}'
                    `, (err, row) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("ROW", row)
                resolve(row)
            }
        });
        closeDB(db)
    })
}
async function getUsers() {
    return new Promise(async (resolve, reject) => {
        let db;
        try {
            db = await openDatabase();
            db.all(`SELECT * FROM users`, (err, rows) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    let users = [];
                    rows.forEach(row => {
                        users.push(row)
                    });
                    resolve(users);
                }
            });
        } catch (error) {
            console.error("Database open error:", error);
            reject(error);
        } finally {
            if (db) {
                closeDB(db);
            }
        }
    });
}

function createUser(mail, akka) {
    return new Promise(async (resolve) => {
        let search = await getUserByMail(mail)
        if(search !== undefined){
            resolve("User alredy exists")
        }else{
            let db = await openDatabase()
            db.run(`INSERT INTO users (mail, akka, kills_as_wolf, wolfs_killed) VALUES (?, ?, ? ,?)`, [mail, akka, 0, 0], function (err) {
                if (err) {
                    return console.error(err.message);
                } else {
                    console.log(`Un usuario ha sido insertado con el correo ${this.lastID}`);
                }
            });
            closeDB(db)
            resolve("User created succesfully!")
        }
    })
}

function increaseKillsAsWolf(mail) {
  return new Promise(async (resolve) => {
      let search = await getUserByMail(mail)
      if(search !== undefined){
          resolve("User exists")
          let kills = search["kills_as_wolf"]
          kills++
          let db = await openDatabase()
          db.run(`UPDATE users SET kills_as_wolf = ? WHERE mail = ?`, [kills, mail], function (err) {
              if (err) {
                  return console.error(err.message);
              } else {
                  console.log(`Un usuario ha sido actulizado`);
              }
          });
          closeDB(db)
          resolve("User created succesfully!")
        }else{
        resolve("User doesn't exists")
      }
  })
}

function increaseWolfsKilled(mail) {
  return new Promise(async (resolve) => {
      let search = await getUserByMail(mail)
      if(search !== undefined){
          resolve("User exists")
          let kills = search["wolfs_killed"]
          kills++
          let db = await openDatabase()
          db.run(`UPDATE users SET wolfs_killed = ? WHERE mail = ?`, [kills, mail], function (err) {
              if (err) {
                  return console.error(err.message);
              } else {
                  console.log(`Un usuario ha sido actualizado`);
              }
          });
          closeDB(db)
          resolve("User created succesfully!")
        }else{
        resolve("User doesn't exists")
      }
  })
}
module.exports = { initializeDB, getUserByMail, createUser, increaseKillsAsWolf,increaseWolfsKilled,getUsers
}