<script>
    import {onDestroy, onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";
    import {companyYear, completeYn} from "../../../scripts/store/store";
    import {DialogType, QuestionType, Yn} from "../../../scripts/util/enum";
    import Loading from "./Loading.svelte";

    let answerList = [];
    let selfSubAnswerList = [];
    let inspectSubAnswerList = [];
    let selfSingleChoiceAnswer = 0;
    let inspectSingleChoiceAnswer = 0;
    let selfMultiChoiceAnswer = [];
    let inspectMultiChoiceAnswer = [];
    let inspectMultiChoicePoint = 0;
    let fileList = [];
    let isCommentShow = false;
    let selectedFile;
    let selectedFileName = '';
    let isLoadingShow = false;
    let data = {
        id: '',
        inspect_result: '',
        inspect_score: '',
        inspect_memo: ''
    };

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

    onMount(() => {
        answerList = extractAnswers(questionList[selectedSeq - 1]); // 답변 리스트
        getFileList();
        // 자체평가 진행 한 항목일 때
        if (questionList[selectedSeq - 1]['self_result'] !== '') {
            updateAnswer();
        }
    })

    onDestroy(() => {
        // 리스너 삭제
        document.removeEventListener('keyup', keyboardEvent);
        window.api.removeResponse('inspectSaveResponse');
        window.api.removeResponse('dialogCallback');
        window.api.removeResponse('selfResponse');
        window.api.removeResponse('fileListResponse');
        window.api.removeResponse('inspectSaveFileResponse');
    })

    document.addEventListener('keyup', keyboardEvent)

    /**
     * MultipleChoice 선택된 답변 배점 총 합
     * */
    function multiChoiceCheck(seq) {
        if (!!seq) {
            // 이미 체크 된 답변
            if (inspectMultiChoiceAnswer.includes(seq.toString())) {
                inspectMultiChoiceAnswer = inspectMultiChoiceAnswer.filter((e) => e !== seq.toString())
            } else inspectMultiChoiceAnswer.push(seq.toString());
        }

        inspectMultiChoicePoint = 0;
        if (inspectMultiChoiceAnswer.length > 0) {
            inspectMultiChoiceAnswer.forEach(e => {
                inspectMultiChoicePoint += answerList[e - 1][`anspoint${e}`]
            });
        }
    }

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
         if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
            // 답변 체크 된 경우 저장 후 다음문항 이동
            if (inspectSingleChoiceAnswer !== 0) {
                data = {
                    id: selectedSeq,
                    inspect_result: inspectSingleChoiceAnswer,
                    inspect_score: answerList[inspectSingleChoiceAnswer - 1][`anspoint${inspectSingleChoiceAnswer}`],
                    inspect_memo: questionList[selectedSeq - 1].inspect_memo || ''
                };
                saveAndMoveToNext(data);
            } else {
                moveToNext();
            }
        } else if (questionList[selectedSeq - 1].type === QuestionType.MultipleChoice) {
             // 객관식 다중체크
             data = {
                 id: selectedSeq,
                 inspect_result: typeof inspectMultiChoiceAnswer === 'string' ? inspectMultiChoiceAnswer : inspectMultiChoiceAnswer.sort().join(';'),
                 inspect_score: inspectMultiChoicePoint,
                 inspect_memo: questionList[selectedSeq - 1].self_memo || ''
             };
             saveAndMoveToNext(data);
         } else {
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
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '마지막 문항입니다.',
                },
                callbackId: 'inspectMoveToNext'
            }
            window.api.request('dialog', dialogOption);
            window.api.response('dialogCallback', (data) => {
                if (data.callbackId === 'inspectMoveToNext') {
                    isModalShow = false;
                    window.api.request('getQuestionInfo'); // question 정보 다시 받아오기
                    window.api.response('selfResponse', (data) => { // question 받아오기 결과
                        questionList = data; // questionList 업데이트
                        selectedSeq = 1;
                    })
                    document.getElementsByTagName('body')[0].style.overflow = 'auto';
                    window.api.removeResponse('dialogCallback');
                    window.api.removeResponse('selfResponse');
                }
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
            getFileList();
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
            multiChoiceCheck();
        } else {
            // 자체평가 답변 없는경우 0, 있는경우 해당 값으로 업데이트
            selfSubAnswerList = questionList[selectedSeq - 1]['self_result'] === '' ? new Array(answerList.length).fill("") : questionList[selectedSeq - 1]['self_result'].split(';'); // 주관식 답변 리스트
            // 현장실사 답변 없는경우 자체평가 답변으로, 있는경우 해당 값으로 업데이트
            inspectSubAnswerList = questionList[selectedSeq - 1]['inspect_result'] === '' ? questionList[selectedSeq - 1]['self_result'].split(';') : questionList[selectedSeq - 1]['inspect_result'].split(';'); // 주관식 답변 리스트
        }
    }

    function keyboardEvent(e) {
        if (document.activeElement.id !== 'textarea') { // textarea focus 상태일 때 해당 이벤트 제외
            // 숫자입력 || numpad로 시작 && numpadEnter 아님 && numpad1, numpad2 처럼 숫자가 포함되어 있음(numpad 특수문자 제외를 위함)
            if (e.code.startsWith('Digit') || e.code.startsWith('Numpad') && e.code !== 'NumpadEnter' && /[0-9]/.test(e.code)) {
                if ($completeYn !== Yn.Y) {
                    if (questionList[selectedSeq - 1].type === QuestionType.SingleChoice) {
                        // 키패드로 입력한 숫자가 전체 답변 갯수보다 클 경우 마지막번호 체크
                        if (Number(e.key) > answerList.length) {
                            inspectSingleChoiceAnswer = answerList.length;
                        } else inspectSingleChoiceAnswer = Number(e.key);
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
                // 화살표 입력 시 문항 이동
                switch (e.code) {
                    case 'ArrowRight': case 'Enter': case 'NumpadEnter': next(); break;
                    case 'ArrowLeft': prev(); break;
                }
            }
        }
    }

    /**
     * 현장실사 첨부파일 리스트 가져오기
     * */
    function getFileList() {
        let questionNum = questionList[selectedSeq - 1].num;
        let path = `../static/files/inspect/${$companyYear}/`;
        window.api.request('getFileList', {questionNum: questionNum, path: path});
        window.api.response('fileListResponse', (data) => {
            fileList = !!data ? data : [];
            window.api.removeResponse('fileListResponse');
        });
    }

    /**
     * 현장실사 파일 첨부
     * */
    function saveInspectFile() {
        let questionNum = questionList[selectedSeq - 1].num;
        // TODO: 동일 파일명 처리
        window.api.response('openFileDialogResponse', (data) => {
            if (data.status) {
                isLoadingShow = true;
                window.api.removeResponse('openFileDialogResponse');
                window.api.request('saveInspectFile', {questionNum: questionNum, year: $companyYear, path: data.value});
            }
        })
        window.api.response('inspectSaveFileResponse', (data) => {
            fileList = [...fileList, data];
            window.api.removeResponse('inspectSaveFileResponse');
            isLoadingShow = false;
        })
        window.api.request('openFileDialog');
    }

    /**
     * 파일명 선택
     * */
    function fileSelect(event, fileName) {
        if (selectedFile) { // 선택 된 파일이 존재할 때
            // 해당 파일의 backgroundColor 초기화
            selectedFile.style.backgroundColor = '';
        }
        event.target.style.backgroundColor = 'lightgray'; // 해당 태그에 backgroundColor 적용
        selectedFile = event.target;
        selectedFileName = fileName; // 파일명 저장
    }

    /**
     * 현장실사 파일 삭제
     * */
    function deleteInspectFile() {
        if (!selectedFileName) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '파일을 선택해주세요.',
                }
            }
            window.api.request('dialog', dialogOption);
        } else {
            let questionNum = questionList[selectedSeq - 1].num;
            window.api.request('deleteFile', {
                questionNum: questionNum,
                fileName: selectedFileName
            });
            window.api.response('deleteFileResponse', (data) => {
                if (data) {
                    fileList = fileList.filter((e) => e !== selectedFileName);
                    window.api.removeResponse('deleteFileResponse');
                }
            })
        }
    }
</script>

{#if isLoadingShow}
    <div class="loading-overlay">
        <Loading bind:isLoadingShow={isLoadingShow}/>
    </div>
{/if}
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
                        {#if questionList[selectedSeq - 1].type === QuestionType.SingleChoice}
                            {#each answerList as list, i}
                                {#if list[Object.keys(list)[0]] !== ''}
                                    <div style="display: flex; justify-content: space-between">
                                        <div>
                                            <input type="radio" value="{i + 1}" bind:group={inspectSingleChoiceAnswer} disabled={$completeYn === Yn.Y}/>
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
                                                               checked={inspectMultiChoiceAnswer.includes((i + 1).toString())}/>
                                                        <span>{list[`answer${i + 1}`]}</span>
                                                        <span>({list[`anspoint${i + 1}`]}점)</span>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                    <div style="width: 10%; display: flex; justify-content: end; align-items: center">
                                        <span>{inspectMultiChoicePoint} / {questionList[selectedSeq - 1].point}</span>
                                    </div>
                                </div>
                            {/key}
                        {:else}
                            <!-- 주관식 -->
                            {#each answerList as list, i}
                                <div style="display: flex; justify-content: space-between">
                                    <span>{list[`answer${i+1}`]}</span>
                                    <input name="answer" bind:value={inspectSubAnswerList[i]} type="text" disabled={$completeYn === Yn.Y}/>
                                </div>
                            {/each}
                        {/if}
                    </div>
                    <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">현장실사 메모</div>
                    <textarea id="textarea" style="width: 100%; min-height: 50px; border: 1px solid black; margin-top: 10px; padding: 10px" bind:value={questionList[selectedSeq - 1].inspect_memo} disabled={$completeYn === Yn.Y}></textarea>

                    <div style="font-size: 20px; font-weight: bold;">파일첨부</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px">
                        <div style="width: 91%; height: 70px; border: 1px solid black; padding: 7px; overflow: auto; display: flex; flex-direction: column; gap: 5px">
                            {#if fileList.length > 0}
                                {#each fileList as list}
                                    <span style="padding: 3px; cursor:pointer;" on:click={() => {fileSelect(event, list)}}>{list}</span>
                                {/each}
                            {/if}
                        </div>
                        <div style="width: 9%; text-align: center">
                            <button on:click={saveInspectFile} disabled={$completeYn === Yn.Y}>첨부</button>
                            <button on:click={deleteInspectFile} disabled={$completeYn === Yn.Y}>삭제</button>
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
    .loading-overlay {
        width: 100%;
        height: 100%;
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99;
    }
</style>