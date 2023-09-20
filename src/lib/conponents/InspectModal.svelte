<script>
    import {onDestroy, onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";

    let answerList = [];
    let selfSubAnswerList = [];
    let inspectSubAnswerList = [];
    let fileList = [];
    let selfCheckedAnswer = 0;
    let inspectCheckedAnswer = 0;
    let isCommentShow = false;
    let data = {
        id: '',
        inspect_result: '',
        inspect_score: '',
        inspect_memo: ''
    };

    export let isModalShow = false;
    export let questionList = [];
    export let selectedSeq = 0;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

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
        window.api.removeResponse('inspectSaveResponse');
        window.api.removeResponse('selfResponse');
    })

    document.addEventListener('keyup', keyboardEvent)

    /**
     * 이전문제
     * */
    function prev() {
        if (selectedSeq !== 1) {
            selectedSeq = selectedSeq - 1;
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            updateAnswer();
        }
    }

    /**
     * 다음문제
     * */
    function next() {
         if (questionList[selectedSeq - 1].type === '객관식') {
            // 답변 체크 된 경우 저장 후 다음문항 이동
            if (inspectCheckedAnswer !== 0) {
                data = {
                    id: selectedSeq,
                    inspect_result: inspectCheckedAnswer,
                    inspect_score: answerList[inspectCheckedAnswer - 1][`anspoint${inspectCheckedAnswer}`],
                    inspect_memo: questionList[selectedSeq - 1].inspect_memo || ''
                };
                saveAndMoveToNext(data);
            } else {
                moveToNext();
            }
        } else if (questionList[selectedSeq - 1].type === '주관식') {
            let inputs = document.getElementsByName('answer');
            let values = Array.from(inputs, input => input.value);
            if (values.every(e => e !== '')) {
                data = {
                    id: selectedSeq,
                    inspect_result: values.join(';'),
                    // TODO: 주관식 답변 점수 스크립트 처리
                    // self_score: 'script 처리 후 입력',
                    inspect_score: 1,
                    inspect_memo: questionList[selectedSeq - 1].inspect_memo || ''
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
        window.api.request('saveInspectAnswer', data); // data 저장
        window.api.response('inspectSaveResponse', (result) => { // 저장 결과
            if (result) {
                moveToNext();
            }
        });
    }

    /**
     * 다음문항 이동
     * */
    function moveToNext() {
        if (selectedSeq === questionList.length) {
            alert('마지막 문항입니다.');
            window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
            window.api.response('selfResponse', (data) => { // question 받아오기 결과
                questionList = data; // questionList 업데이트
                selectedSeq = 1;
                isModalShow = false;
            })
        } else {
            selectedSeq = selectedSeq + 1; // 다음문항 이동
            isCommentShow = false; // 지표 해설 팝업창 close
        }
        window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
        window.api.response('selfResponse', (data) => { // question 받아오기 결과
            questionList = data; // questionList 업데이트
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            updateAnswer();
            // 리스너 삭제
            window.api.removeResponse('inspectSaveResponse');
            window.api.removeResponse('selfResponse');
        });
    }

    /**
     * 상단 셀렉트 박스로 문항 선택 시 해당 문항으로 이동
     * */
    function selectQuestion() {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 객관식 답변 리스트
        updateAnswer();
    }

    function popUpComment() {
        isCommentShow = true;
    }

    function updateAnswer() {
        if (questionList[selectedSeq - 1].type === '객관식') {
            selfCheckedAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : questionList[selectedSeq - 1]['self_result']; // 체크된 답변 변경
            inspectCheckedAnswer = questionList[selectedSeq - 1]['inspect_result'] === '' ? questionList[selectedSeq - 1]['self_result'] : questionList[selectedSeq - 1]['inspect_result'] // 체크된 답변 변경
        } else {
            selfSubAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
            inspectSubAnswerList = questionList[selectedSeq - 1]['inspect_result'] === '' ? questionList[selectedSeq - 1]['self_result'].split(';') : questionList[selectedSeq - 1]['inspect_result'].split(';'); // 주관식 답변 리스트
        }
    }

    function keyboardEvent(e) {
        if (document.activeElement.id !== 'textarea') {
            if (e.code.startsWith('Digit') || e.code.startsWith('Numpad') && e.code !== 'NumpadEnter') {
                if (questionList[selectedSeq - 1].type === '객관식') {
                    inspectCheckedAnswer = Number(e.key);
                }
            } else {
                switch (e.code) {
                    case 'ArrowRight': case 'Enter': case 'NumpadEnter': next(); break;
                    case 'ArrowLeft': prev(); break;
                }
            }
        }
    }

    function saveInspectFile() {
        window.api.request('saveInspectFile', selectedSeq);
        window.api.response('inspectSaveFileResponse', (data) => {
            fileList = [...fileList, data];
            window.api.removeResponse('inspectSaveFileResponse');
        })
    }
</script>

<div class="modal-overlay" on:click={() => {isModalShow = false;}}>
    <div style="width: 100%; min-height: 700px; background-color: white; border: 1px solid black" on:click={preventModalClose}>
        <div on:click={preventModalClose} style="padding: 5px">
            <!-- Modal contents start -->
            <div style="display: flex; justify-content: space-between">
                <div style="display: flex; align-items: center">
                    <select bind:value={selectedSeq} on:change={selectQuestion} on:keydown={(e) => {e.preventDefault()}}>
                        {#each questionList as list}
                            <option value="{list.id}">{list.num}</option>
                        {/each}
                    </select>
                    <div style="margin-left: 20px">
                        <span>{questionList[selectedSeq - 1].stalenessYn === 'Y' ? '부실도 대상입니다.' : ''}</span>
                    </div>
                </div>
                {#if isCommentShow}
                    <div style="width: 300px; height: 150px; border: 1px solid black; position: fixed; background-color: white; right: 50px">
                        <div style="display: flex; justify-content: end; margin-right: 5px; cursor: pointer" on:click={() => {isCommentShow = false}}>X</div>
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



            <!-- 자체평가 시작 -->
            <div style="display: flex; justify-content: space-between">
                <div style="width: 49%;">
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">답변</div>
                    <div style="margin-top: 10px; border: 1px solid black; padding: 10px">
                        <!-- 객관식 -->
                        {#if questionList[selectedSeq - 1].type === '객관식'}
                            {#each answerList as list, i}
                                {#if list[Object.keys(list)[0]] !== ''}
                                    <div style="display: flex; justify-content: space-between">
                                        <div>
                                            <input type="radio" value="{i + 1}" bind:group={selfCheckedAnswer} disabled/>
                                            <span>{list[`answer${i + 1}`]}</span>
                                        </div>
                                        <span>{list[`anspoint${i + 1}`]} / {answerList[0]['anspoint1']}</span>
                                    </div>
                                {/if}
                            {/each}
                        {:else}
                            <!-- 주관식 -->
                            {#each answerList as list, i}
                                <div style="display: flex; justify-content: space-between">
                                    <span>{list[`answer${i+1}`]}</span>
                                    <input bind:value={selfSubAnswerList[i]} type="text"/>
                                </div>
                            {/each}
                        {/if}
                    </div>
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold">비고</div>
                    <div style="min-height: 128px; border: 1px solid black; margin-top: 10px; padding: 10px; overflow: auto">{questionList[selectedSeq - 1].self_memo}</div>
                </div>
                <!-- 자체평가 종료 -->
                <!-- 현장실사 시작 -->
                <div style="width: 49%;">
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">현장실사 답변</div>
                    <div style="margin-top: 10px; border: 1px solid black; padding: 10px">
                        <!-- 객관식 -->
                        {#if questionList[selectedSeq - 1].type === '객관식'}
                            {#each answerList as list, i}
                                {#if list[Object.keys(list)[0]] !== ''}
                                    <div style="display: flex; justify-content: space-between">
                                        <div>
                                            <input type="radio" value="{i + 1}" bind:group={inspectCheckedAnswer}/>
                                            <span>{list[`answer${i + 1}`]}</span>
                                        </div>
                                        <span>{list[`anspoint${i + 1}`]} / {answerList[0]['anspoint1']}</span>
                                    </div>
                                {/if}
                            {/each}
                        {:else}
                            <!-- 주관식 -->
                            {#each answerList as list, i}
                                <div style="display: flex; justify-content: space-between">
                                    <span>{list[`answer${i+1}`]}</span>
                                    <input name="answer" bind:value={inspectSubAnswerList[i]} type="text"/>
                                </div>
                            {/each}
                        {/if}
                    </div>
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">현장실사 메모</div>
                    <textarea id="textarea" style="width: 100%; min-height: 50px; border: 1px solid black; margin-top: 10px; padding: 10px" bind:value={questionList[selectedSeq - 1].inspect_memo}></textarea>

                    <div style="font-size: 20px; font-weight: bold;">파일첨부</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px">
                        <div style="width: 91%; height: 65px; border: 1px solid black; padding: 10px; overflow: auto; display: flex; flex-direction: column; gap: 5px">
                            {#if fileList.length > 0}
                                {#each fileList as list}
                                    <span>{list}</span>
                                {/each}
                            {/if}
                        </div>
                        <div style="width: 9%; text-align: center">
                            <button on:click={saveInspectFile}>첨부</button>
                            <button>삭제</button>
                        </div>
                    </div>

                    <div style="display:flex; justify-content: end; margin-top: 20px; margin-right: 50px; gap: 20px">
                        <h1 style="cursor: pointer" on:click={prev}>←</h1>
                        <h1 style="cursor: pointer" on:click={next}>→</h1>
                    </div>
                </div>
            </div>
            <!-- 현장실사 종료 -->





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