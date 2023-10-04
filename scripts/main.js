const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');
const path = require("path");

let db;

module.exports = {
    mainRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 메인페이지 데이터 불러오기
     * */
    getMainInfo: ipcMain.on('getMainInfo', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        db.get(`
            SELECT company_seq FROM basic_info
        `, (err, data) => {
            if (err) {
                console.log('Empty Basic Info:: ', err.message);
            } else {
                db.get(`
                    SELECT * FROM company WHERE id = ${data.company_seq}
                `, (err, data) => {
                    if (err) {
                        console.log('Company Info loading Error:: ', err.message);
                    } else {
                        event.sender.send('mainResponse', data);
                    }
                })
            }
        })
    })
}