<script>
    import Header from "../../lib/layout/Header.svelte";
    import {onDestroy, onMount} from "svelte";
    import {
        companyCode,
        companyName,
        companySeq,
        companyYear,
        completeYn,
        isFinalListShow
    } from "../../../scripts/store/store";
    import FinalResultModal from "../../lib/conponents/FinalResultModal.svelte";
    import FinalResultFileLoad from "../../lib/conponents/FinalResultFileLoad.svelte";
    import {MainTitle, Yn} from "../../../scripts/util/enum";
    import Loading from "../../lib/conponents/Loading.svelte";

    let title = MainTitle.FinalResult;
    let questionList = [];
    let companyResultList = [];
    let isLoadingShow = false;
    $: selfScore = questionList.reduce((acc, item) => acc + item.self_score, 0); // 자체평가 점수
    $: inspectScore = questionList.reduce((acc, item) => acc + item.inspect_score, 0) // 현장실사 점수
    $: totalScore = questionList.reduce((acc, item) => acc + item.point, 0); // 평가 총점
    // $: inspectManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 관리 점수
    $: totalManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.point, 0); // 관리 총점
    // $: inspectTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 기술 점수
    $: totalTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.point, 0); // 기술 총점
    // $: inspectCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 위기 점수
    $: totalCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.point, 0); // 위기 총점
    $: activityScore = companyResultList.activity_value; // 추가 활동 점수
    $: trainingScore = companyResultList.training_value; // 훈련 점수
    $: totalTraining = companyResultList.training_max; // 훈련 총점
    $: protectScore = companyResultList.protect_value; // 기반시설 점수
    $: totalProtect = companyResultList.protect_max; // 기반시설 총점
    $: insolvencyScore = questionList.filter(e => e.self_result !== e.inspect_result).reduce(acc => acc + 0.1, 0); // 전체 부실도 (self_result != inspect_result 항목당 0.1점)
    $: manageInsolvencyScore = questionList.filter(e => e.self_result !== e.inspect_result).filter(e => e.num >= 10000 && e.num < 20000).reduce(acc => acc + 0.1, 0); // 관리 부실도
    $: techInsolvencyScore = questionList.filter(e => e.self_result !== e.inspect_result).filter(e => e.num >= 20000 && e.num < 30000).reduce(acc => acc + 0.1, 0); // 기술 부실도
    $: crisisInsolvencyScore = questionList.filter(e => e.self_result !== e.inspect_result).filter(e => e.num >= 30000).reduce(acc => acc + 0.1, 0); // 위기 부실도

    let isModalShow = false;
    let isFileLoadShow = false;
    let selectedSeq = 0;

    onMount(() => {
        // 평가 결과 파일을 한 번이라도 불러 온 경우
        if ($isFinalListShow) {
            window.api.response('selfResponse', (data) => {
                questionList = data;
                window.api.removeResponse('selfResponse');
            })
            window.api.request('getQuestionInfo');
        }

        window.api.response('companyResultResponse', (data) => {
            companyResultList= data;
            window.api.removeResponse('companyResultResponse');
        })
        window.api.request('getFinalResult', $companySeq);
    })

    onDestroy(() => {
        window.api.removeResponse('selfResponse')
        window.api.removeResponse('companyResultResponse')
        window.api.removeResponse('getFinalFileResponse')
        window.api.removeResponse('mainResponse')
    })

    /**
     * 평가 결과 파일 불러오기
     * */
    function getFile() {
        window.api.response('openFileDialogResponse', (data) => {
            if (data.status) {
                isLoadingShow = true;
                window.api.removeResponse('openFileDialogResponse');
                window.api.request('getFinalFile', data.value);
            }
        })
        window.api.response('getFinalFileResponse', (data) => {
            if (data === 'canceled') {
                console.log('Canceled.');
            } else if (data) {
                window.api.request('getQuestionInfo');
                window.api.response('selfResponse', (data) => {
                    questionList = data;
                    window.api.removeResponse('selfResponse');
                })
                // 파일 로딩 성공 시 리스트 출력
                $isFinalListShow = true;
                // 기관정보 store값 업데이트
                window.api.response('mainResponse', (data) => {
                    $companyName = data.name;
                    $companySeq = data.id;
                    $companyCode = data.code;
                    $companyYear = data.year;
                    $completeYn = Yn.Y; // 현장실사 완료

                    window.api.removeResponse('mainResponse');
                })
                window.api.request('getMainInfo');
                // completeYn 수정
                // static/files/result/해당년도에 파일 저장 (sqlite + 현장실사 첨부파일)
            } else {

            }
            window.api.removeResponse('getFinalFileResponse');
            isLoadingShow = false;
        })
        window.api.request('openFileDialog');
    }

    /**
     * PDF 출력
     * */
    function getPDF() {

    }

    /**
     * 자체평가 상세 모달창 오픈
     * */
    function openModal(seq) {
        selectedSeq = seq + 1;
        isModalShow = true;
        document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    }
</script>

<main>
    {#if isLoadingShow}
        <div class="loading-overlay">
            <Loading bind:isLoadingShow={isLoadingShow}/>
        </div>
    {/if}
    {#if isModalShow}
        <FinalResultModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} bind:selectedSeq = {selectedSeq}/>
    {/if}
    {#if isFileLoadShow}
        <FinalResultFileLoad bind:isFileLoadShow={isFileLoadShow} bind:questionList = {questionList}/>
    {/if}
    <Header {title}/>

    {#if $isFinalListShow}
        <div style="margin-top: 30px;">
            <b>자체평가: </b><span>{selfScore} / {totalScore}</span> <br>
            <b>현장실사: </b><span>{inspectScore} / {totalScore}</span>
            <b>부실도: </b><span>{insolvencyScore}</span> <br>
            <b>이의신청: </b><span>[[이의신청(계산식필요)]] / {totalScore}</span>
            <b>추가활동: </b><span>{activityScore}</span>
            <b>훈련점수: </b><span>{trainingScore} / {totalTraining}</span>
            <b>기반시설: </b><span>{protectScore} / {totalProtect}</span> <br>
            <b>총점: </b><span>[[총점(계산식필요)]] / {totalScore}</span>
            <b>관리: </b><span>[[분야총점 - 분야부실도]] / {totalManage}</span>
            <b>기술: </b><span>[[분야총점 - 분야부실도]] / {totalTech}</span>
            <b>위기: </b><span>[[분야총점 - 분야부실도]] / {totalCrisis}</span>
        </div>
    {/if}
        <div style="display: flex; justify-content: end; margin-top: 30px">
            <button on:click={() => {isFileLoadShow = true; document.getElementsByTagName('body')[0].style.overflow = 'hidden';}}>이전 데이터</button>
            <button on:click={getFile} style="margin-left: 5px">불러오기</button>
            {#if $isFinalListShow}
                <button on:click={getPDF} style="margin-left: 5px">PDF 출력</button>
            {/if}
        </div>
    {#if $isFinalListShow}
        <table style="width: 100%">
            <thead>
            <tr style="background-color: black; color: white; height: 50px;">
                <th width="5%">순번</th>
                <th width="10%">항목번호</th>
                <th width="5%">배점</th>
                <th width="5%">부실도</th>
                <th width="15%">자체평가점수</th>
                <th width="15%">현장실사점수</th>
                <th width="45%">질문</th>
            </tr>
            </thead>
            <tbody>
            {#await questionList}
            {:then questionList}
                {#each questionList as list, i}
                    <tr on:click={() => {openModal(i)}} style="height: 50px; text-align: center; background-color: {list.self_score === list.inspect_score ? 'white' : 'khaki'}">
                        <td>{list.id}</td>
                        <td>{list.num}</td>
                        <td>{list.point}</td>
                        <td>{list.self_score === list.inspect_score ? '-' : 0.1}</td>
                        <td>{list.self_score}</td>
                        <td>{list.inspect_score}</td>
                        <td>{list.question}</td>
                    </tr>
                {/each}
            {/await}
            </tbody>
        </table>
    {/if}
</main>

<style>
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