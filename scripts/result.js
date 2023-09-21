const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');

let db;

module.exports = {
    resultRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 메인페이지 데이터 불러오기
     * */
    getFinalResult: ipcMain.on('getFinalResult', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
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