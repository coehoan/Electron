const {initRequest} = require('../scripts/init');
const {mainRequest} = require('../scripts/main');
const {infoRequest} = require('../scripts/info');
const {selfEvalRequest} = require('../scripts/selfEvaluation');
const {fileRequest} = require('../scripts/file');
const {inspectRequest} = require('../scripts/inspect');

module.exports = {
    initRequest, mainRequest, infoRequest, selfEvalRequest, fileRequest, inspectRequest
}