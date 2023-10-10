const {ipcMain, dialog} = require('electron');
const path = require("path");
const {mainWindow} = require("../electron/main");

let db;

module.exports = {
    dialogRequest: (channel, handlers) => ipcMain.on(channel, handlers),
    /**
     * 평가 답변 저장
     * */
    dialog: ipcMain.on('dialog', (event, args) => {
        dialog.showMessageBox(mainWindow, args.option)
            .then(r => {
                event.sender.send('dialogCallback', args.callbackId)
            });
    })
};