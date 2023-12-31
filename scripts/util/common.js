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
 * 빈값이 있으면 false, 없으면 true 리턴
 * */
export function checkSelfScores(data) {
    return data.every(item => !!item.self_score);
}

/**
 * inspect_score에 빈값 있는지 체크
 * 빈값이 있으면 false, 없으면 true 리턴
 * */
export function checkInspectScores(data) {
    try {
        data.forEach((e) => {
            if (e.inspect_score === '' || e.inspect_score === null || e.inspect_score === undefined) {
                throw new Error();
            }
        })
        return true;
    } catch (e) {
        return false
    }
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
        let anspointKey = `anspoint${(i + 1).toString()}`;

        let answerObj = {};
        answerObj[answerKey] = data[answerKey];
        answerObj[anspointKey] = data[anspointKey];

        // 빈 값이 없을 때만 push
        if (!!data[answerKey]) {
            answers.push(answerObj);
        }
    }
    return answers;
}

export function emailCheck(email) {
    return email.toLowerCase().match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}
