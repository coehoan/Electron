<script>
    import {onDestroy, onMount} from "svelte";
    import SelfEvaluationModal from "../../lib/conponents/SelfEvaluationModal.svelte";
    import {checkSelfScores} from "../../../scripts/util/common";
    import Header from "../../lib/layout/Header.svelte";
    import {completeYn} from "../../../scripts/store/store";

    let title = '보안관리 실태평가';
    let questionList = [];
    $: selfProgress = questionList.filter(e => e.self_result !== '').length; // 자체평가 진행도
    $: selfScore = questionList.reduce((acc, item) => acc + item.self_score, 0); // 자체평가 점수
    $: totalScore = questionList.reduce((acc, item) => acc + item.point, 0); // 자체평가 총점
    $: selfManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.self_score, 0); // 관리 점수
    $: totalManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.point, 0); // 관리 총점
    $: selfTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.self_score, 0); // 기술 점수
    $: totalTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.point, 0); // 기술 총점
    $: selfCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.self_score, 0); // 위기 점수
    $: totalCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.point, 0); // 위기 총점
    let isModalShow = false;
    let selectedSeq = 0;

    onMount(() => {
        window.api.response('selfResponse', (data) => {
            questionList = data;
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
        <SelfEvaluationModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} bind:selectedSeq = {selectedSeq}/>
    {/if}
    <Header {title}/>
    <div style="margin-top: 30px">
        <b>진행도: {selfProgress} / {questionList.length}</b>
        <table style="width: 100%">
            <thead>
            <tr style="background-color: black; color: white; height: 30px;">
                <th width="20%">구분</th>
                <th width="20%">총점</th>
                <th width="20%">관리</th>
                <th width="20%">기술</th>
                <th width="20%">위기대응</th>
            </tr>
            </thead>
            <tbody>
            <tr style="text-align: center">
                <td>자체평가</td>
                <td>{selfScore} / {totalScore}</td>
                <td>{selfManage} / {totalManage}</td>
                <td>{selfTech} / {totalTech}</td>
                <td>{selfCrisis} / {totalCrisis}</td>
            </tr>
            </tbody>
        </table>
    </div>

    <div style="display: flex; justify-content: end; margin-top: 30px">
        {#if $completeYn !== 'Y'}
            <button on:click={submit}>최종제출</button>
        {/if}
    </div>

    <table style="width: 100%">
        <thead>
        <tr style="background-color: black; color: white; height: 50px;">
            <th width="5%">순번</th>
            <th width="15%">항목번호</th>
            <th width="10%">배점</th>
            <th width="15%">자체평가점수</th>
            <th width="55%">질문</th>
        </tr>
        </thead>
        <tbody>
        {#each questionList as list, i}
            <tr on:click={() => {openModal(i)}} style="height: 50px; text-align: center; background-color: {list.self_score === '' ? 'darkcyan' : 'white'}">
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
</style>