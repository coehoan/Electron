const { contextBridge, ipcRenderer } = require('electron');

let requestChannels = ['existFile', 'fileUpload', 'getCompanyList', 'setBasicInfo', 'setAdminInfo', 'getMainInfo', 'getCompanyInfo', 'deleteAdmin', 'saveAdmin', 'getQuestionInfo', 'importFile', 'exportFile', 'saveSelfAnswer', 'saveInspectAnswer', 'saveInspectFile', 'getFileList', 'deleteFile', 'getFinalResult', 'getFinalFile', 'getOlderFileList', 'getOlderFileData'];
let responseChannels = ['testResponse', 'mainResponse', 'step1Response', 'step2Response', 'step2CompanyList', 'step3Response', 'infoResponse', 'adminResponse', 'selfResponse', 'evalSaveResponse', 'fileResponse', 'inspectResponse', 'inspectSaveResponse', 'inspectSaveFileResponse', 'fileListResponse', 'deleteFileResponse', 'companyResultResponse', 'getFinalFileResponse', 'getOlderFileListResponse', 'olderFileDataResponse'];
contextBridge.exposeInMainWorld(
    "api", {
        response: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        removeResponse: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
        responseOnce: (channel, func) => {
            if (responseChannels.includes(channel)) {
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
        request: (channel, data) => {
            if (requestChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        }
    }
);