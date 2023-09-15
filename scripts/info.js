const {ipcMain} = require('electron');
const sqlite3 = require('sqlite3');
const {ca} = require("wait-on/exampleConfig");

let db;

module.exports = {
    infoRequest: (channel, handlers) => ipcMain.on(channel, handlers),

    /**
     * 기관 데이터 불러오기
     * */
    getCompanyInfo: ipcMain.on('getCompanyInfo', (event, args) => {
        db = new sqlite3.Database('./db/evaluation.db');
        db.all(`
            SELECT a.id, a.name admin_name, a.roles, a.email, a.tel, a.phone, a.type, c.code, c.type company_type, c.name, c.address FROM admin a
            INNER JOIN company c ON a.company_seq = c.id
            WHERE a.basic_info_seq = 1
        `, (err, data) => {
            if (err) {
                console.log('Empty Company Info:: ', err.message);
            } else {
                event.sender.send('infoResponse', data);
                ipcMain.removeListener('infoResponse', () => {})
            }
        })
    }),

    /**
     * 담당자 삭제
     * */
    deleteAdmin: ipcMain.on('deleteAdmin', (event, args) => {
        try {
            db.run(`
            DELETE FROM admin
            WHERE id = ${args}
        `, (err) => {
                if (err) {
                    console.log('Delete Admin Fail:: ', err.message);
                } else {
                    event.sender.send('adminResponse', true);
                }
            })
        } catch (e) {
            event.sender.send('adminResponse', false);
        }
    }),

    /**
     * 담당자 저장
     * */
    saveAdmin: ipcMain.on('saveAdmin', (event, args) => {
        try {
            args.forEach((e) => {
                db.run(`
                    INSERT INTO admin('basic_info_seq', 'company_seq', 'name', 'roles', 'email', 'tel', 'phone', 'type')
                    VALUES('${e.basic_info_seq}', '${e.company_seq}', '${e.name}', '${e.roles}', '${e.email}', '${e.tel}', '${e.phone}', '${e.type}')
                `, (err) => {
                    if (err) {
                        console.log('Admin data insert error occurred:: '.err.message);
                    }
                })
            })
            event.sender.send('adminResponse', true);
        } catch (e) {
            event.sender.send('adminResponse', false);
        }
    })
}