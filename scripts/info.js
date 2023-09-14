const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');

let db;

module.exports = {
    infoRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 메인페이지 데이터 불러오기
     * */
    getCompanyInfo: ipcMain.on('getCompanyInfo', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        db.all(`
            SELECT a.id, a.name admin_name, a.roles, a.email, a.tel, a.phone, a.type, c.name, c.address FROM admin a
            INNER JOIN company c ON a.company_seq = c.id
            WHERE a.basic_info_seq = 1
        `, (err, data) => {
            if (err) {
                console.log('Empty Company Info:: ', err.message);
            } else {
                event.sender.send('info-response', data);
            }
        })
    })
}