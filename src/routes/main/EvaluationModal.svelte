<script>
    import {onMount} from "svelte";
    import {extractAnswers, splitArray} from "../../../scripts/util/common";

    let answerList = [];
    let checkedAnswer = 0;
    export let isModalShow = false;
    export let questionList = [];
    export let selectedSeq = 0;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    onMount(() => {
        answerList = extractAnswers(questionList[selectedSeq]); // 객관식 답변 리스트
        if (questionList[selectedSeq]['self_result'] !== '') {
            checkedAnswer = questionList[selectedSeq]['self_result'] === '' ? 0 : questionList[selectedSeq]['self_result'];
        }
    })

    // TODO: 앞뒤이동 체크
    function prev() {
        if (selectedSeq === 0) {
            alert('마지막')
        } else if (checkedAnswer !== 0) {
            let data = {
                id: selectedSeq + 1,
                self_result: checkedAnswer,
                self_score: answerList[checkedAnswer - 1][`anspoint${checkedAnswer}`]
            }
            window.api.request('saveAnswer', data)
            window.api.response('evalSaveResponse', (result) => {
                if (result) {
                    selectedSeq -= 1;
                    checkedAnswer = questionList[selectedSeq]['self_result'] === '' ? 0 : questionList[selectedSeq]['self_result'];
                }
            })
        } else {
            selectedSeq -= 1;
            checkedAnswer = questionList[selectedSeq]['self_result'] === '' ? 0 : questionList[selectedSeq]['self_result'];
        }
        console.log(selectedSeq)
    }
    function next() {
        if (selectedSeq === questionList.length) {
            alert('마지막')
        } else if (checkedAnswer !== 0) {
            let data = {
                id: selectedSeq + 1,
                self_result: checkedAnswer,
                self_score: answerList[checkedAnswer - 1][`anspoint${checkedAnswer}`]
            }
            window.api.request('saveAnswer', data)
            window.api.response('evalSaveResponse', (result) => {
                if (result) {
                    selectedSeq += 1;
                    checkedAnswer = questionList[selectedSeq]['self_result'] === '' ? 0 : questionList[selectedSeq]['self_result'];
                }
            })
        } else {
            selectedSeq += 1;
            checkedAnswer = questionList[selectedSeq]['self_result'] === '' ? 0 : questionList[selectedSeq]['self_result'];
        }
        console.log(selectedSeq)
    }
</script>

<div class="modal-overlay" on:click={() => {isModalShow = false;}}>
    <div style="width: 100%; height: 700px; background-color: white; border: 1px solid black" on:click={preventModalClose}>
        <div on:click={preventModalClose} style="padding: 5px">
            <!-- Modal contents start -->
            <div style="display: flex; justify-content: space-between">
                <div style="display: flex; align-items: center">
                    <select bind:value={questionList[selectedSeq].num}>
                        {#each questionList as list}
                            <option value="{list.num}">{list.num}</option>
                        {/each}
                    </select>
                    <div style="margin-left: 20px">
                        <span>{questionList[selectedSeq].stalenessYn === 'Y' ? '부실도 대상입니다.' : ''}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; margin-right: 20px">
                    <b>?</b>
                </div>
            </div>
            <div style="height: 150px; border: 1px solid black; padding: 0 10px">
                <p>{questionList[selectedSeq].question}</p>
                <ul>
                    {#each splitArray(questionList[selectedSeq].evidence) as list}
                    <li>{list}</li>
                    {/each}
                </ul>
            </div>
            <h3>답변</h3>
            <div style="width: 60%; height: 100%; border: 1px solid black; margin-top: 10px; padding: 10px">
                {#if questionList[selectedSeq].type === '객관식'}
                    {#each answerList as list, i}
                        <div style="display: flex; justify-content: space-between">
                            <div>
                                <input type="radio" value="{i + 1}" bind:group={checkedAnswer}/>
                                <span>{list[`answer${i+1}`]}</span>
                            </div>
                            <span>{list[`anspoint${i+1}`]} / {answerList[0]['anspoint1']}</span>
                        </div>
                    {/each}
                {:else}
                    {#each answerList as list, i}
                        <div style="display: flex; justify-content: space-between">
                            <span>{list[`answer${i+1}`]}</span>
                            <input type="text"/>
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