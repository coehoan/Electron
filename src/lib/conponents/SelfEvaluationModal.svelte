<script>
    import {onDestroy, onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";
    import {completeYn} from "../../../scripts/store/store";
    import {DialogType, QuestionType, Yn} from "../../../scripts/util/enum";

    let answerList = [];
    let subAnswerList = [];
    let singleChoiceAnswer = 0;
    let multiChoicePoint = 0;
    let multiChoiceAnswer = [];
    let isCommentShow = false;

    let dialogOption = {
        option: {
            type: '',
            buttons: [],
            defaultId: 0,
            title: '',
            message: '',
            detail: '',
        },
        callbackId: ''
    }

    export let isModalShow = false;
    export let questionList = [];
    export let selectedSeq = 0;

    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    let subAnswerElements = [];

    onMount(() => {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
        // 자체평가 진행 한 항목일 때
        if (questionList[selectedSeq - 1]['self_result'] !== '') {
            updateAnswer();
        }
    })

    onDestroy(() => {
        // 리스너 삭제
        document.removeEventListener('keyup', keyboardEvent);
        window.api.removeResponse('evalSaveResponse');
        window.api.removeResponse('selfResponse');
        window.api.removeResponse('dialogCallback');
    })

    document.addEventListener('keyup', keyboardEvent)

    /**
     * MultipleChoice 선택된 답변 배점 총 합
     * */
    function multiChoiceCheck(seq) {
        if (!!seq) {
            // 이미 체크 된 답변
            if (multiChoiceAnswer.includes(seq.toString())) {
                multiChoiceAnswer = multiChoiceAnswer.filter((e) => e !== seq.toString())
            } else multiChoiceAnswer.push(seq.toString());
        }

        multiChoicePoint = 0;
        if (multiChoiceAnswer.length > 0) {
            multiChoiceAnswer.forEach(e => {
                multiChoicePoint += answerList[e - 1][`anspoint${e}`]
            });
        }
    }

    /**
     * 이전문제
     * */
    function prev() {
        if (selectedSeq !== 1) {

            let data = {
                id: '',
                self_result: '',
                self_score: '',
                self_memo: ''
            };
            // 객관식 단일체크
            if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
                // 답변 체크 된 경우 저장 후 다음문항 이동
                if (singleChoiceAnswer !== 0) {
                    data = {
                        id: selectedSeq,
                        self_result: singleChoiceAnswer,
                        self_score: answerList[singleChoiceAnswer - 1][`anspoint${singleChoiceAnswer}`],
                        self_memo: questionList[selectedSeq - 1].self_memo || ''
                    };
                    saveAndMoveToPrev(data);
                } else {
                    moveToPrev();
                }
            } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
                // 객관식 다중체크
                data = {
                    id: selectedSeq,
                    self_result: typeof multiChoiceAnswer === 'string' ? multiChoiceAnswer : multiChoiceAnswer.sort().join(';'),
                    self_score: multiChoicePoint,
                    self_memo: questionList[selectedSeq - 1].self_memo || ''
                };
                saveAndMoveToPrev(data);

            } else {
                // 주관식
                let inputs = document.getElementsByName('answer');
                let values = Array.from(inputs, input => input.value);

                if (values.every(e => e !== '')) {
                    data = {
                        id: selectedSeq,
                        self_result: values.join(';'),
                        // TODO: 주관식 답변 점수 스크립트 처리
                        // self_score: 'script 처리 후 입력',
                        self_score: 1,
                        self_memo: questionList[selectedSeq - 1].self_memo || ''
                    };
                    saveAndMoveToPrev(data);
                } else {
                    moveToPrev();
                }
            }
        }
    }

    /**
     * 다음문제
     * */
    function next() {
        let data = {
            id: '',
            self_result: '',
            self_score: '',
            self_memo: ''
        };
        // 객관식 단일체크
        if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
            // 답변 체크 된 경우 저장 후 다음문항 이동
            if (singleChoiceAnswer !== 0) {
                data = {
                    id: selectedSeq,
                    self_result: singleChoiceAnswer,
                    self_score: answerList[singleChoiceAnswer - 1][`anspoint${singleChoiceAnswer}`],
                    self_memo: questionList[selectedSeq - 1].self_memo || ''
                };
                saveAndMoveToNext(data);
            } else {
                moveToNext();
            }
        } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
            // 객관식 다중체크
            data = {
                id: selectedSeq,
                self_result: typeof multiChoiceAnswer === 'string' ? multiChoiceAnswer : multiChoiceAnswer.sort().join(';'),
                self_score: multiChoicePoint,
                self_memo: questionList[selectedSeq - 1].self_memo || ''
            };
            saveAndMoveToNext(data);

        } else {
            // 주관식
            let inputs = document.getElementsByName('answer');
            let values = Array.from(inputs, input => input.value);

            if (values.every(e => e !== '')) {
                data = {
                    id: selectedSeq,
                    self_result: values.join(';'),
                    // TODO: 주관식 답변 점수 스크립트 처리
                    // self_score: 'script 처리 후 입력',
                    self_score: 1,
                    self_memo: questionList[selectedSeq - 1].self_memo || ''
                };
                saveAndMoveToNext(data);
            } else {
                moveToNext();
            }
        }
    }

    /**
     * 답변 저장 후 다음문항 이동
     * */
    function saveAndMoveToNext(data) {
        // moveToNext();
        window.api.request('saveSelfAnswer', data); // data 저장
        window.api.response('evalSaveResponse', (result) => { // 저장 결과
            if (result) {
                moveToNext();
            }
        });
    }

    function saveAndMoveToPrev(data) {
        window.api.request('saveSelfAnswer', data); // data 저장
        window.api.response('evalSaveResponse', (result) => { // 저장 결과
            if (result) {
                moveToPrev();
            }
        });
    }

    function moveToPrev() {
        selectedSeq = selectedSeq - 1; // 다음문항 이동
        isCommentShow = false; // 지표 해설 팝업창 close
        window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
        window.api.response('selfResponse', (data) => { // question 받아오기 결과
            questionList = data; // questionList 업데이트
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
                singleChoiceAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : parseInt(questionList[selectedSeq - 1]['self_result']); // 체크된 답변 변경
            } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
                // 객관식 다중항목
                // 체크된 답변 변경
                multiChoiceAnswer = (questionList[selectedSeq - 1]['self_result'] === '') // 빈값일 때
                    ? [] // 빈 배열
                    : questionList[selectedSeq - 1]['self_result'].includes(';') // ;로 구분처리 된 값이 있을 때
                        ? questionList[selectedSeq - 1]['self_result'].split(';') // ;로 split
                        : new Array(1).fill(questionList[selectedSeq - 1]['self_result']); // 답변이 1개만 체크됐을 때 length 1짜리 배열
                multiChoiceCheck();
            } else {
                subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
                subAnswerElements = document.getElementsByName('answer');
                subAnswerElements[0].focus();
            }
            // 리스너 삭제
            window.api.removeResponse('evalSaveResponse');
            window.api.removeResponse('selfResponse');
        });
    }

    /**
     * 다음문항 이동
     * */
    function moveToNext() {
        if (selectedSeq === questionList.length) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '마지막 문항입니다.',
                },
                callbackId: 'selfMoveToNext'
            }
            window.api.request('dialog', dialogOption);
            window.api.response('dialogCallback', (data) => {
                if (data.callbackId === 'selfMoveToNext') {
                    window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
                    window.api.response('selfResponse', (data) => { // question 받아오기 결과
                        questionList = data; // questionList 업데이트
                        selectedSeq = 1;
                    })
                    isModalShow = false; // 모달창 닫기
                    document.getElementsByTagName('body')[0].style.overflow = 'auto';
                    window.api.removeResponse('dialogCallback');
                    window.api.removeResponse('selfResponse');
                }
            });
        } else {
            selectedSeq = selectedSeq + 1; // 다음문항 이동
            isCommentShow = false; // 지표 해설 팝업창 close
        }
        window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
        window.api.response('selfResponse', (data) => { // question 받아오기 결과
            questionList = data; // questionList 업데이트
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
                singleChoiceAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : parseInt(questionList[selectedSeq - 1]['self_result']); // 체크된 답변 변경
            } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
                // 객관식 다중항목
                // 체크된 답변 변경
                multiChoiceAnswer = (questionList[selectedSeq - 1]['self_result'] === '') // 빈값일 때
                    ? [] // 빈 배열
                    : questionList[selectedSeq - 1]['self_result'].includes(';') // ;로 구분처리 된 값이 있을 때
                        ? questionList[selectedSeq - 1]['self_result'].split(';') // ;로 split
                        : new Array(1).fill(questionList[selectedSeq - 1]['self_result']); // 답변이 1개만 체크됐을 때 length 1짜리 배열
                multiChoiceCheck();
            } else {
                subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
                subAnswerElements = document.getElementsByName('answer');
                subAnswerElements[0].focus();
            }
            // 리스너 삭제
            window.api.removeResponse('evalSaveResponse');
            window.api.removeResponse('selfResponse');
        });
    }

    /**
     * 상단 셀렉트 박스로 문항 선택 시 해당 문항으로 이동
     * */
    function selectQuestion() {
        updateAnswer();
    }

    function popUpComment() {
        isCommentShow = true;
    }


    function updateAnswer() {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
        if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
            // 객관식 단일항목
            singleChoiceAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : parseInt(questionList[selectedSeq - 1]['self_result']); // 체크된 답변 변경
        } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
            // 객관식 다중항목
            // 체크된 답변 변경
            multiChoiceAnswer = (questionList[selectedSeq - 1]['self_result'] === '') // 빈값일 때
                ? [] // 빈 배열
                : questionList[selectedSeq - 1]['self_result'].includes(';') // ;로 구분처리 된 값이 있을 때
                    ? questionList[selectedSeq - 1]['self_result'].split(';') // ;로 split
                    : new Array(1).fill(questionList[selectedSeq - 1]['self_result']); // 답변이 1개만 체크됐을 때 length 1짜리 배열
            multiChoiceCheck();
        } else {
            // 주관식
            subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
        }
    }

    function keyboardEvent(e) {
        if (document.activeElement.id !== 'textarea') {
            // 숫자입력 || numpad로 시작 && numpadEnter 아님 && numpad1, numpad2 처럼 숫자가 포함되어 있음(numpad 특수문자 제외를 위함)
            if (e.code.startsWith('Digit') || e.code.startsWith('Numpad') && e.code !== 'NumpadEnter' && /[0-9]/.test(e.code)) {
                if ($completeYn !== Yn.Y) {
                    // 객관식 단일체크
                    if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
                        // 키패드로 입력한 숫자가 전체 답변 갯수보다 클 경우 마지막번호 체크
                        if (Number(e.key) > answerList.length) {
                            singleChoiceAnswer = answerList.length;
                        } else singleChoiceAnswer = Number(e.key);
                        // 객관식 다중항목
                    } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
                        if (Number(e.key) <= answerList.length) {
                            // 체크박스 체크
                            let selectedAnswer = document.getElementsByName(`checkbox${Number(e.key) - 1}`)[0];
                            selectedAnswer.checked = !selectedAnswer.checked;
                            multiChoiceCheck(Number(e.key))
                        }
                    }
                }
            } else {
                switch (e.code) {
                    case 'ArrowRight':
                    case 'Enter':
                    case 'NumpadEnter':
                        next();
                        break;
                    case 'ArrowLeft':
                        prev();
                        break;
                }
            }
        }
    }
</script>

<div class="modal-overlay"
     on:click={() => {isModalShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style="width: 100%; min-height: 700px; background-color: white; border: 1px solid black"
         on:click={preventModalClose}>
        <div style="border-bottom: 1px solid black; height: 30px; display: flex; justify-content: end">
            <div style="cursor:pointer; font-size: 20px; margin-right: 10px"
                 on:click={() => {isModalShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
                X
            </div>
        </div>
        <div on:click={preventModalClose} style="padding: 5px">
            <!-- Modal contents start -->
            <div style="display: flex; justify-content: space-between">
                <div style="display: flex; align-items: center">
                    <select bind:value={selectedSeq} on:change={selectQuestion}
                            on:keydown={(e) => {e.preventDefault()}}>
                        {#each questionList as list}
                            <option value="{list.id}">{list.num}</option>
                        {/each}
                    </select>
                    <div style="margin-left: 20px">
                        <span>{questionList[selectedSeq - 1].stalenessYn === Yn.Y ? '부실도 대상입니다.' : ''}</span>
                    </div>
                </div>
                {#if isCommentShow}
                    <div style="width: 300px; height: 150px; border: 1px solid black; position: fixed; background-color: white; right: 50px">
                        <div style="display: flex; justify-content: end; margin-right: 5px; cursor: pointer"
                             on:click={() => {isCommentShow = false}}>X
                        </div>
                        <div style="padding: 5px">
                            {questionList[selectedSeq - 1].comment}
                        </div>
                    </div>
                {/if}
                <div style="display: flex; align-items: center; margin-right: 20px">
                    <div style="font-size: 20px; font-weight: bold; cursor: pointer" on:click={popUpComment}>?</div>
                </div>
            </div>
            <div style="height: 150px; border: 1px solid black; padding: 0 10px">
                <p>{questionList[selectedSeq - 1].question}</p>
                <ul>
                    {#each splitArray(questionList[selectedSeq - 1].evidence) as list}
                        <li>{list}</li>
                    {/each}
                </ul>
            </div>
            <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">답변</div>
            <div style="width: 60%; height: 100%; border: 1px solid black; margin-top: 10px; padding: 10px">
                <!-- 객관식 단일체크 -->
                {#if questionList[selectedSeq - 1].type === QuestionType.SingleChoice}
                    {#each answerList as list, i}
                        {#if list[Object.keys(list)[0]] !== ''}
                            <div style="display: flex; justify-content: space-between">
                                <div>
                                    <input type="radio" value="{i + 1}" bind:group={singleChoiceAnswer}
                                           disabled={$completeYn === Yn.Y}/>
                                    <span>{list[`answer${i + 1}`]}</span>
                                </div>
                                <span>{list[`anspoint${i + 1}`]} / {answerList[0]['anspoint1']}</span>
                            </div>
                        {/if}
                    {/each}
                {:else if questionList[selectedSeq - 1].type === QuestionType.MultipleChoice}
                    <!-- 객관식 다중체크 -->
                    {#key answerList}
                        <div style="display: flex">
                            <div style="width: 90%">
                                {#each answerList as list, i}
                                    {#if list[Object.keys(list)[0]] !== ''}
                                        <div style="display: flex; justify-content: space-between">
                                            <div>
                                                <input type="checkbox" name="checkbox{i}" value="{i + 1}"
                                                       disabled={$completeYn === Yn.Y}
                                                       on:change={() => {multiChoiceCheck(i + 1)}}
                                                       checked={multiChoiceAnswer.includes((i + 1).toString())}/>
                                                <span>{list[`answer${i + 1}`]}</span>
                                                <span>({list[`anspoint${i + 1}`]}점)</span>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                            <div style="width: 10%; display: flex; justify-content: end; align-items: center">
                                <span>{multiChoicePoint} / {questionList[selectedSeq - 1].point}</span>
                            </div>
                        </div>
                    {/key}
                {:else}
                    <!-- 주관식 -->
                    {#each answerList as list, i}
                        <div style="display: flex; justify-content: space-between">
                            <span>{list[`answer${i + 1}`]}</span>
                            <input name="answer" bind:value={subAnswerList[i]} type="text"
                                   disabled={$completeYn === Yn.Y}/>
                        </div>
                    {/each}
                {/if}
            </div>
            <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">비고</div>
            <textarea id="textarea"
                      style="width: 62%; height: 100%; min-height: 100px; border: 1px solid black; margin-top: 10px; padding: 10px"
                      bind:value={questionList[selectedSeq - 1].self_memo}></textarea>
            <div style="display:flex; justify-content: end; margin-top: 20px; margin-right: 50px; gap: 20px">
                <h1 style="cursor: pointer" on:click={prev}>←</h1>
                <h1 style="cursor: pointer" on:click={next}>→</h1>
            </div>
            <!-- Modal contents end -->
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        width: 98.5%;
        height: 100%;
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center
    }

    textarea {
        resize: none;
    }
</style>