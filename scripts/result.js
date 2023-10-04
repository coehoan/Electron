const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');
const path = require("path");

let db;

module.exports = {
    resultRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 메인페이지 데이터 불러오기
     * */
    getFinalResult: ipcMain.on('getFinalResult', (event, args) => {
        let dbPath = path.join(__dirname, '../db');
        let dbFilePath = path.join(dbPath, '/evaluation.db');
        db = new sqlite3.Database(dbFilePath);
        db.get(`
            SELECT * FROM company WHERE id = ${args}
        `, (err, row) => {
            if (err) {
                console.log('Get company result error:: ', err.message);
            } else {
                event.sender.send('companyResultResponse', row);
            }
        })
    })
}