<script>
    import Header from "../../lib/layout/Header.svelte";
    import {companyName} from "../../../scripts/store/store";
    import {onMount} from "svelte";

    let title = '보안관리 결과';
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
</script>

<main>
    <Header {title}/>
    <div style="margin-top: 30px;">
        <b>자체평가: </b><span>{selfScore} / {totalScore}</span> <br>
        <b>현장실사: </b><span>{selfScore} / {totalScore}</span>
        <b>부실도: </b><span>{selfScore} / {totalScore}</span> <br>
        <b>이의신청: </b><span>{selfScore} / {totalScore}</span>
        <b>추가활동: </b><span>{selfScore} / {totalScore}</span>
        <b>훈련점수: </b><span>{selfScore} / {totalScore}</span>
        <b>기반시설: </b><span>{selfScore} / {totalScore}</span> <br>
        <b>총점: </b><span>{selfScore} / {totalScore}</span>
        <b>관리: </b><span>{selfScore} / {totalScore}</span>
        <b>기술: </b><span>{selfScore} / {totalScore}</span>
        <b>위기: </b><span>{selfScore} / {totalScore}</span>
    </div>
</main>

<style>

</style>