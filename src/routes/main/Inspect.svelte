<script>
    import Header from "../../lib/layout/Header.svelte";
    import {onDestroy, onMount} from "svelte";
    import {checkSelfScores} from "../../../scripts/util/common";
    import InspectModal from "../../lib/conponents/InspectModal.svelte";
    import {companyYear, completeYn} from "../../../scripts/store/store";

    let title = '보안관리 현장실사';
    let questionList = [];
    $: selfProgress = questionList.filter(e => e.self_result !== '').length; // 자체평가 진행도
    $: selfScore = questionList.reduce((acc, item) => acc + item.self_score, 0); // 자체평가 점수
    $: inspectScore = questionList.reduce((acc, item) => acc + item.inspect_score, 0) // 현장실사 점수
    $: totalScore = questionList.reduce((acc, item) => acc + item.point, 0); // 평가 총점
    $: selfManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.self_score, 0); // 자체평가 관리 점수
    $: inspectManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 관리 점수
    $: totalManage = questionList.filter(e => e.num >= 10000 && e.num < 20000).reduce((acc, item) => acc + item.point, 0); // 관리 총점
    $: selfTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.self_score, 0); // 자체평가 기술 점수
    $: inspectTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 기술 점수
    $: totalTech = questionList.filter(e => e.num >= 20000 && e.num < 30000).reduce((acc, item) => acc + item.point, 0); // 기술 총점
    $: selfCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.self_score, 0); // 자체평가 위기 점수
    $: inspectCrisis = questionList.filter(e => e.num >= 30000).reduce((acc, item) => acc + item.inspect_score, 0); // 현장실사 위기 점수
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
    function submit() {        // 미응답 항목 체크
        if (checkSelfScores(questionList)) {
            window.api.request('exportFile', $companyYear);
            window.api.response('fileResponse', (data) => {
                if (data) {
                    alert('제출완료');
                    window.api.removeResponse('fileResponse');
                    $completeYn = 'Y'; // 현장실사 완료
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

    function getColor(list) {
        return list.inspect_score === '' ? 'darkcyan' :
                (list.inspect_score !== '' && list.inspect_score === list.self_score) ? 'white' :
                (list.inspect_score !== '' && list.inspect_score !== list.self_score) ? 'khaki' : '';
    }
</script>

<main>
    {#if isModalShow}
        <InspectModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} bind:selectedSeq = {selectedSeq}/>
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
            <tr style="text-align: center;">
                <td>자체평가</td>
                <td>{selfScore} / {totalScore}</td>
                <td>{selfManage} / {totalManage}</td>
                <td>{selfTech} / {totalTech}</td>
                <td>{selfCrisis} / {totalCrisis}</td>
            </tr>
            <tr style="text-align: center">
                <td>현장실사</td>
                <td>{inspectScore} / {totalScore}</td>
                <td>{inspectManage} / {totalManage}</td>
                <td>{inspectTech} / {totalTech}</td>
                <td>{inspectCrisis} / {totalCrisis}</td>
            </tr>
            </tbody>
        </table>
    </div>

    <div style="display: flex; justify-content: end; margin-top: 30px">
        {#if $completeYn !== 'Y'}
            <button on:click={submit}>Export</button>
        {/if}
    </div>
    <table style="width: 100%">
        <thead>
        <tr style="background-color: black; color: white; height: 50px;">
            <th width="5%">순번</th>
            <th width="10%">항목번호</th>
            <th width="5%">배점</th>
            <th width="15%">자체평가점수</th>
            <th width="15%">현장실사점수</th>
            <th width="50%">질문</th>
        </tr>
        </thead>
        <tbody>
        {#each questionList as list, i}
            <tr on:click={() => {openModal(i)}} style="height: 50px; text-align: center; background-color: {getColor(list)}">
                <td>{list.id}</td>
                <td>{list.num}</td>
                <td>{list.point}</td>
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