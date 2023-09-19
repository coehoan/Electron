<script>
    import {onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";

    let answerList = [];
    let subAnswerList = [];
    let checkedAnswer = 0;

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
            if (questionList[selectedSeq - 1].type === '객관식') {
                checkedAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : questionList[selectedSeq - 1]['self_result']; // 체크된 답변 변경
            } else {
                subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
            }
        }
    })

    /**
     * 이전문제
     * */
    function prev() {
        if (selectedSeq === 1) {
            alert('마지막')
        } else {
            selectedSeq -= 1;
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            if (questionList[selectedSeq - 1].type === '객관식') {
                checkedAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : questionList[selectedSeq - 1]['self_result']; // 체크된 답변 변경
            } else {
                subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';');
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
            self_score: ''
        };

        if (selectedSeq === questionList.length) {
            alert('마지막');
        } else if (questionList[selectedSeq - 1].type === '객관식') {
            // 답변 체크 된 경우 저장 후 다음문항 이동
            if (checkedAnswer !== 0) {
                data = {
                    id: selectedSeq,
                    self_result: checkedAnswer,
                    self_score: answerList[checkedAnswer - 1][`anspoint${checkedAnswer}`]
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
                    self_result: values.join(';'),
                    self_score: 'script 처리 후 입력'
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
        window.api.request('saveAnswer', data); // data 저장
        window.api.response('evalSaveResponse', (result) => { // 저장 결과
            if (result) {
                moveToNext();
            }
        });
    }

    /**
     * 다음문항 이동
     * */
    function moveToNext() {
        selectedSeq += 1; // 다음문항 이동
        window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
        window.api.response('selfResponse', (data) => { // question 받아오기 결과
            questionList = data; // questionList 업데이트
            answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
            if (questionList[selectedSeq - 1].type === '객관식') {
                checkedAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : questionList[selectedSeq - 1]['self_result']; // 체크된 답변 변경
            } else {
                subAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
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
        checkedAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : questionList[selectedSeq - 1]['self_result']; // 체크된 답변 변경
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 객관식 답변 리스트
    }

    document.addEventListener('keyup', (e) => {
        if (e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
            if (questionList[selectedSeq - 1].type === '객관식') {
                checkedAnswer = Number(e.key);
            }
        } else {
            switch (e.code) {
                case 'ArrowRight': case 'Enter': next(); break;
                case 'ArrowLeft': prev(); break;
            }
        }
    })
</script>

<div class="modal-overlay" on:click={() => {isModalShow = false;}}>
    <div style="width: 100%; height: 700px; background-color: white; border: 1px solid black" on:click={preventModalClose}>
        <div on:click={preventModalClose} style="padding: 5px">
            <!-- Modal contents start -->
            <div style="display: flex; justify-content: space-between">
                <div style="display: flex; align-items: center">
                    <select bind:value={selectedSeq} on:change={selectQuestion}>
                        {#each questionList as list}
                            <option value="{list.id}">{list.num}</option>
                        {/each}
                    </select>
                    <div style="margin-left: 20px">
                        <span>{questionList[selectedSeq - 1].stalenessYn === 'Y' ? '부실도 대상입니다.' : ''}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; margin-right: 20px">
                    <b>?</b>
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
            <h3>답변</h3>
            <div style="width: 60%; height: 100%; border: 1px solid black; margin-top: 10px; padding: 10px">
                <!-- 객관식 -->
                {#if questionList[selectedSeq - 1].type === '객관식'}
                    {#each answerList as list, i}
                        {#if list[Object.keys(list)[0]] !== ''}
                            <div style="display: flex; justify-content: space-between">
                                <div>
                                    <input type="radio" value="{i + 1}" bind:group={checkedAnswer}/>
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
                            <input name="answer" bind:value={subAnswerList[i]} type="text"/>
                        </div>
                    {/each}
                {/if}
            </div>
            <h3>비고</h3>
            <div style="width: 60%; height: 100%; min-height: 50px; border: 1px solid black; margin-top: 10px; padding: 10px"></div>
            <div style="display:flex; justify-content: end; margin-top: 20px; margin-right: 50px; gap: 20px">
                <h1 on:click={prev}>←</h1>
                <h1 on:click={next}>→</h1>
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
</style>