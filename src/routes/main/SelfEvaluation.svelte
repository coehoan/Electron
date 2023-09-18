<script>
    import {companyName, year} from "../../../scripts/store/store";
    import {push} from "svelte-spa-router";
    import {onDestroy, onMount} from "svelte";
    import EvaluationModal from "./EvaluationModal.svelte";

    let questionList = [];
    let selfProgress, totalManage, selfManage, totalTech, selfTech, totalCrisis, selfCrisis, totalScore ,selfScore;
    let isModalShow = false;
    let selectedSeq = 0;

    onMount(() => {
        window.api.response('selfResponse', (data) => {
            questionList = data;
            selfProgress = questionList.filter(e => e.self_result !== '').length; // 자체평가 진행도
            selfScore = questionList.reduce((acc, item) => acc + item.self_score, 0); // 자체평가 점수
            totalScore = questionList.reduce((acc, item) => acc + item.point, 0); // 자체평가 총점
            selfManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.self_score, 0); // 관리 점수
            totalManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.point, 0); // 관리 총점
            selfTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.self_score, 0); // 기술 점수
            totalTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.point, 0); // 기술 총점
            selfCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.self_score, 0); // 위기 점수
            totalCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.point, 0); // 위기 총점
        })
        window.api.request('getQuestionInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('selfResponse');
    })

    /**
     * 최종 제출
     * */
    function submit() {
        // 미응답 항목 체크
        if (questionList.every((e) => { e.self_score !== ''})) {
            window.api.request('exportFile')
            alert('제출완료')
        } else alert('답변이 완료되지 않았습니다.')
    }

    /**
    * 자체평가 상세 모달창 오픈
    * */
    function openModal(seq) {
        selectedSeq = seq + 1;
        isModalShow = true
    }
</script>

<main>
    {#if isModalShow}
        <EvaluationModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} {selectedSeq}/>
    {/if}
    <h1>자체평가</h1>
    <div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
        <div style="display:flex; align-items: center; gap: 5px">
            <button on:click={() => {push('/main')}}>홈</button>
            <button on:click={() => {push('/info')}}>기관정보</button>
            <button on:click={() => {push('/self')}}>자체평가</button>
            <button on:click={() => {push('/inspect')}}>현장실사</button>
            <button on:click={() => {push('/result')}}>평가관리</button>
            <button>환경설정</button>
        </div>
        <div style="display:flex; gap: 5px">
            <p>{$year}년 </p>
            <p>{$companyName}</p>
            <p>보안관리 실태평가</p>
        </div>
    </div>

    <div style="margin-top: 30px">
        <b>기관명: </b><span>{$companyName}</span>
        <b>진행: </b><span>{selfProgress} / {questionList.length}</span>
        <b>자체평가: </b><span>{selfScore} / {totalScore}</span>
        <b>관리: </b><span>{selfManage} / {totalManage}</span>
        <b>기술: </b><span>{selfTech} / {totalTech}</span>
        <b>위기: </b><span>{selfCrisis} / {totalCrisis}</span>
    </div>
    <div style="display: flex; justify-content: end; margin-top: 30px">
        <button on:click={submit}>최종제출</button>
    </div>
    <table style="width: 100%">
        <thead>
        <tr style="background-color: black; color: white">
            <th width="5%">순번</th>
            <th width="15%">항목번호</th>
            <th width="10%">배점</th>
            <th width="15%">자체평가점수</th>
            <th width="55%">질문</th>
        </tr>
        </thead>
        <tbody>
        {#each questionList as list, i}
            <tr on:click={() => {openModal(i)}} style="background-color: {list.self_score === '' ? 'darkcyan' : 'white'}">
                <td>{list.id}</td>
                <td>{list.num}</td>
                <td>{list.point}</td>
                <td>{list.self_score}</td>
                <td>{list.question}</td>
            </tr>
        {/each}
        </tbody>
    </table>
</main>

<style>
    tr {
        height: 50px;
    }
    td {
        text-align: center;
        width: 150px;
    }
</style>