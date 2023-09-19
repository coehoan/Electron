/**
 * 현재 년도 구하기
 * */
export function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * 문자열 구분자로 자르기 ( ; )
 * */
export function splitArray(array) {
    return array.split(';');
}

/**
 * self_score에 빈값 있는지 체크
 * */
export function checkSelfScores(data) {
    return data.some(item => !!item.self_score);
}

/**
 * questionList 에서 answer, anspoint만 추출
 * */
export function extractAnswers(data) {
    let answers = [];
    let keys = Object.keys(data);

    let answerKeys = keys.filter(key => key.startsWith("answer"));

    for (let i = 0; i < answerKeys.length; i++) {
        let answerKey = answerKeys[i];
        let anspointKey = `anspoint${answerKey.replace("answer", "")}`;

        let answerObj = {};
        answerObj[answerKey] = data[answerKey];
        answerObj[anspointKey] = data[anspointKey];
        answers.push(answerObj);
    }
    return answers;
}