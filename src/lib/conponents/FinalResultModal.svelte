<script>
    import {onDestroy, onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";
    import {companyYear} from "../../../scripts/store/store";
    import {DialogType, QuestionType, Yn} from "../../../scripts/util/enum";

    let answerList = [];
    let selfSubAnswerList = [];
    let inspectSubAnswerList = [];
    let selfSingleChoiceAnswer = 0;
    let inspectSingleChoiceAnswer = 0;
    let selfMultiChoiceAnswer = [];
    let inspectMultiChoiceAnswer = [];
    let selfMultiChoicePoint = 0;
    let inspectMultiChoicePoint = 0;
    let fileList = [];
    let isCommentShow = false;

    let dialogOption = {
        option: {
            type: DialogType.Info,
            buttons: [],
            defaultId: 0,
            title: '알림',
            message: '',
            detail: '마지막 문항입니다.',
        },
        callbackId: 'finalMoveToNext'
    }

    export let isModalShow = false;
    export let questionList = [];
    export let selectedSeq = 0;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    onMount(() => {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
        getFileList();
        updateAnswer();
    })

    onDestroy(() => {
        // 리스너 삭제
        document.removeEventListener('keyup', keyboardEvent);
        window.api.removeResponse('fileListResponse');
        window.api.removeResponse('dialogCallback');
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
            getFileList();
        }
    }

    /**
     * 다음문제
     * */
    function next() {
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
                callbackId: 'finalMoveToNext'
            }
            window.api.request('dialog', dialogOption);
            window.api.response('dialogCallback', (data) => {
                if (data.callbackId === 'finalMoveToNext') {
                    isModalShow = false;
                    document.getElementsByTagName('body')[0].style.overflow = 'auto';
                    window.api.removeResponse('dialogCallback');
                }
            })
        } else {
            selectedSeq = selectedSeq + 1; // 다음문항 이동
            isCommentShow = false; // 지표 해설 팝업창 close
        }
        updateAnswer();
        getFileList();
    }

    /**
     * 상단 셀렉트 박스로 문항 선택 시 해당 문항으로 이동
     * */
    function selectQuestion() {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 객관식 답변 리스트
        updateAnswer();
        getFileList();
    }

    /**
     * 평가지표 해설 modal창 오픈
     * */
    function popUpComment() {
        isCommentShow = true;
    }

    /**
     * 답변 업데이트
     * */
    function updateAnswer() {
        if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
            // 자체평가 답변 없는경우 0, 있는경우 해당 값으로 업데이트
            selfSingleChoiceAnswer = questionList[selectedSeq - 1]['self_result'] === '' ? 0 : parseInt(questionList[selectedSeq - 1]['self_result']);
            // 현장실사 답변 없는경우 자체평가 답변으로, 있는경우 해당 값으로 업데이트
            inspectSingleChoiceAnswer = questionList[selectedSeq - 1]['inspect_result'] === '' ? parseInt(questionList[selectedSeq - 1]['self_result']) : parseInt(questionList[selectedSeq - 1]['inspect_result']) // 체크된 답변 변경
        } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
            selfMultiChoiceAnswer = (questionList[selectedSeq - 1]['self_result'] === '') // 빈값일 때
                ? [] // 빈 배열
                : questionList[selectedSeq - 1]['self_result'].includes(';') // ;로 구분처리 된 값이 있을 때
                ? questionList[selectedSeq - 1]['self_result'].split(';') // ;로 split
                : new Array(1).fill(questionList[selectedSeq - 1]['self_result']); // 답변이 1개만 체크됐을 때 length 1짜리 배열
            inspectMultiChoiceAnswer = (questionList[selectedSeq - 1]['inspect_result'] === '' && questionList[selectedSeq - 1]['inspect_score'] === '') // result, score 둘 다 빈값일 때
                ? selfMultiChoiceAnswer // 자체평가랑 동일하게
                : questionList[selectedSeq - 1]['inspect_result'] === '' && questionList[selectedSeq - 1]['inspect_score'] === 0 // result는 빈값, score는 0일때 (아무것도 체크 안하고 저장된 경우)
                ? [] // 빈 배열
                : questionList[selectedSeq - 1]['inspect_result'].includes(';') // ;로 구분처리 된 값이 있을 때
                ? questionList[selectedSeq - 1]['inspect_result'].split(';') // ;로 split
                : new Array(1).fill(questionList[selectedSeq - 1]['inspect_result']); // 답변이 1개만 체크됐을 때 length 1짜리 배열
        } else {
            // 자체평가 답변 없는경우 0, 있는경우 해당 값으로 업데이트
            selfSubAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
            // 현장실사 답변 없는경우 자체평가 답변으로, 있는경우 해당 값으로 업데이트
            inspectSubAnswerList = questionList[selectedSeq - 1]['inspect_result'] === '' ? questionList[selectedSeq - 1]['self_result'].split(';') : questionList[selectedSeq - 1]['inspect_result'].split(';'); // 주관식 답변 리스트
        }
    }

    /**
     * 현장실사 첨부파일 리스트 가져오기
     * */
    function getFileList() {
        let path = `../static/files/inspect/${$companyYear}/`;
        let questionNum = questionList[selectedSeq - 1].num;
        window.api.request('getFileList', {questionNum: questionNum, path: path});
        window.api.response('fileListResponse', (data) => {
            fileList = !!data ? data : [];
            window.api.removeResponse('fileListResponse');
        })
    }

    function keyboardEvent(e) {
        // 화살표 입력 시 문항 이동
        switch (e.code) {
            case 'ArrowRight': case 'Enter': case 'NumpadEnter': next(); break;
            case 'ArrowLeft': prev(); break;
        }
    }
</script>

<div class="modal-overlay" on:click={() => {isModalShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style="width: 100%; min-height: 700px; background-color: white; border: 1px solid black" on:click={preventModalClose}>
        <div style="border-bottom: 1px solid black; height: 30px; display: flex; justify-content: end">
            <div style="cursor:pointer; font-size: 20px; margin-right: 10px" on:click={() => {isModalShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
                X
            </div>
        </div>
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
                        <span>{questionList[selectedSeq - 1].stalenessYn === Yn.Y ? '부실도 대상입니다.' : ''}</span>
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
                        {#if questionList[selectedSeq - 1].type === QuestionType.SingleChoice}
                            {#each answerList as list, i}
                                {#if list[Object.keys(list)[0]] !== ''}
                                    <div style="display: flex; justify-content: space-between">
                                        <div>
                                            <input type="radio" value="{i + 1}" bind:group={selfSingleChoiceAnswer} disabled/>
                                            <span>{list[`answer${i + 1}`]}</span>
                                        </div>
                                        <span>{list[`anspoint${i + 1}`]} / {answerList[0]['anspoint1']}</span>
                                    </div>
                                {/if}
                            {/each}
                        {:else if questionList[selectedSeq - 1].type === QuestionType.MultipleChoice}
                            <!-- 객관식 다중체크 -->
                            <div style="display: flex">
                                <div style="width: 90%">
                                    {#each answerList as list, i}
                                        {#if list[Object.keys(list)[0]] !== ''}
                                            <div style="display: flex; justify-content: space-between">
                                                <div>
                                                    <input type="checkbox" value="{i + 1}"
                                                           checked={selfMultiChoiceAnswer.includes((i + 1).toString())} disabled/>
                                                    <span>{list[`answer${i + 1}`]}</span>
                                                    <span>({list[`anspoint${i + 1}`]}점)</span>
                                                </div>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                                <div style="width: 10%; display: flex; justify-content: end; align-items: center">
                                    <span>{questionList[selectedSeq - 1].self_score} / {questionList[selectedSeq - 1].point}</span>
                                </div>
                            </div>
                        {:else}
                            <!-- 주관식 -->
                            {#each answerList as list, i}
                                <div style="display: flex; justify-content: space-between">
                                    <span>{list[`answer${i+1}`]}</span>
                                    <input bind:value={selfSubAnswerList[i]} type="text" disabled/>
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
                        {#if questionList[selectedSeq - 1].type === QuestionType.SingleChoice}
                            {#each answerList as list, i}
                                {#if list[Object.keys(list)[0]] !== ''}
                                    <div style="display: flex; justify-content: space-between">
                                        <div>
                                            <input type="radio" value="{i + 1}" bind:group={inspectSingleChoiceAnswer} disabled/>
                                            <span>{list[`answer${i + 1}`]}</span>
                                        </div>
                                        <span>{list[`anspoint${i + 1}`]} / {answerList[0]['anspoint1']}</span>
                                    </div>
                                {/if}
                            {/each}
                        {:else if questionList[selectedSeq - 1].type === QuestionType.MultipleChoice}
                            <!-- 객관식 다중체크 -->
                            <div style="display: flex">
                                <div style="width: 90%">
                                    {#each answerList as list, i}
                                        {#if list[Object.keys(list)[0]] !== ''}
                                            <div style="display: flex; justify-content: space-between">
                                                <div>
                                                    <input type="checkbox" value="{i + 1}"
                                                           checked={inspectMultiChoiceAnswer.includes((i + 1).toString())} disabled/>
                                                    <span>{list[`answer${i + 1}`]}</span>
                                                    <span>({list[`anspoint${i + 1}`]}점)</span>
                                                </div>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                                <div style="width: 10%; display: flex; justify-content: end; align-items: center">
                                    <span>{questionList[selectedSeq - 1].inspect_score} / {questionList[selectedSeq - 1].point}</span>
                                </div>
                            </div>
                        {:else}
                            <!-- 주관식 -->
                            {#each answerList as list, i}
                                <div style="display: flex; justify-content: space-between">
                                    <span>{list[`answer${i+1}`]}</span>
                                    <input name="answer" bind:value={inspectSubAnswerList[i]} type="text" disabled/>
                                </div>
                            {/each}
                        {/if}
                    </div>
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">현장실사 메모</div>
                    <div style="min-height: 50px; border: 1px solid black; margin-top: 10px; padding: 10px">{questionList[selectedSeq - 1].inspect_memo}</div>
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">파일첨부</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px">
                        <div style="width: 100%; height: 70px; border: 1px solid black; padding: 7px; overflow: auto; display: flex; flex-direction: column; gap: 5px">
                            {#if fileList.length > 0}
                                {#each fileList as list}
                                    <span style="padding: 3px;">{list}</span>
                                {/each}
                            {/if}
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