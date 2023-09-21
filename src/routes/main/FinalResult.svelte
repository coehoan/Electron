<script>
    import Header from "../../lib/layout/Header.svelte";
    import {onMount} from "svelte";
    import {checkSelfScores} from "../../../scripts/util/common";
    import {companySeq} from "../../../scripts/store/store";
    import FinalResultModal from "../../lib/conponents/FinalResultModal.svelte";

    let title = '보안관리 결과';
    let questionList = [];
    let companyResultList = [];
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
    $: insolvencyScore = questionList.filter(e => e.self_result === e.inspect_result).reduce(acc => acc + 0.1, 0); // 전체 부실도 (self_result != inspect_result 항목당 0.1점)
    $: manageInsolvencyScore = questionList.filter(e => e.self_result === e.inspect_result).filter(e => e.num >= 10000 && e.num < 20000).reduce(acc => acc + 0.1, 0); // 관리 부실도
    $: techInsolvencyScore = questionList.filter(e => e.self_result === e.inspect_result).filter(e => e.num >= 20000 && e.num < 30000).reduce(acc => acc + 0.1, 0); // 기술 부실도
    $: crisisInsolvencyScore = questionList.filter(e => e.self_result === e.inspect_result).filter(e => e.num >= 30000).reduce(acc => acc + 0.1, 0); // 위기 부실도

    let isModalShow = false;
    let selectedSeq = 0;

    onMount(() => {
        window.api.response('selfResponse', (data) => {
            questionList = data;
            window.api.removeResponse('selfResponse');
        })
        window.api.response('companyResultResponse', (data) => {
            companyResultList= data;
            window.api.removeResponse('companyResultResponse');
        })
        window.api.request('getQuestionInfo');
        window.api.request('getFinalResult', $companySeq);
    })

    /**
     * 최종 제출
     * */
    function submit() {
        // 미응답 항목 체크
        if (checkSelfScores(questionList)) {
            window.api.request('exportFile');
            window.api.response('fileResponse', (data) => {
                if (data) {
                    alert('제출완료');
                    window.api.removeResponse('fileResponse')
                }
            })
        } else alert('답변이 완료되지 않았습니다.');
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
    {#if isModalShow}
        <FinalResultModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} bind:selectedSeq = {selectedSeq}/>
    {/if}
    <Header {title}/>
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

    <div style="display: flex; justify-content: end; margin-top: 30px">
        <button on:click={submit}>불러오기</button>
        <button on:click={submit} style="margin-left: 5px">PDF 출력</button>
    </div>
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
        </tbody>
    </table>
</main>

<style>

</style>