/*
const {ipcMain} = require("electron");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database('./db/evaluation.db');
const window = require('electron').BrowserWindow;

module.exports = {
    create: ipcMain.on('create', (event, args) => {
        db.run(args, (err) => {
            if (err) {
                console.log('Create Error:: ', err.message);
            } else console.log('Create Success');
        })
    }),
    insert: ipcMain.on('insert', (event, args) => {
        db.run(args, (err) => {
            if (err) {
                console.log('Insert Error:: ', err.message);
            } else console.log('Insert Success');
        })
    }),
    update: ipcMain.on('update', (event, args) => {
        db.run(args, (err) => {
            if (err) {
                console.log('Update Error:: ', err.message);
            } else console.log('Update Success');
        })
    }),
    del: ipcMain.on('delete', (event, args) => {
        let select = 'select id from student order by id DESC limit 1';
        db.get(select, (err, data) => {
            if (err) {
                console.log('Delete Error:: ', err.message);
            } else {
                let del = `delete from student where id = ${data.id}`;
                db.run(del, (err) => {
                    if (err) {
                        console.log('Delete Error:: ', err.message);
                    } else console.log('Delete Success');
                })
            }
        })
    }),
    select: ipcMain.on('select', (event, args) => {
        db.all(args, (err, data) => {
            if (err) {
                console.log('Select Error:: ', err.message);
            } else {
                console.log('Select Success');
                window.getFocusedWindow().webContents.send('response', data);
            }
        })
    })
}*/
