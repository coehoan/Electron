<script>
    import {companyName, year} from "../../../scripts/store/store";
    import {push} from "svelte-spa-router";
    import {onDestroy} from "svelte";

    let questionList = [];
    let totalManage = 0;
    let totalTech = 0;
    let totalCrisis = 0;
    let totalScore = 0;

    window.api.responseOnce('selfResponse', (data) => {
        questionList = data;
        console.log(questionList.length)
    })
    window.api.request('getQuestionInfo');
</script>

<main>
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
        <b>진행: </b><span> / {questionList.length}</span>
        <b>자체평가: </b><span> / {totalScore}</span>
        <b>관리: </b><span> / {totalManage}</span>
        <b>기술: </b><span> / {totalTech}</span>
        <b>위기: </b><span> / {totalCrisis}</span>
    </div>

    <table style="margin-top: 100px; width: 100%">
        <thead>
            <tr>
                <th width="5%">순번</th>
                <th width="15%">항목번호</th>
                <th width="10%">배점</th>
                <th width="15%">자체평가점수</th>
                <th width="55%">질문</th>
            </tr>
        </thead>
        <tbody>
        {#each questionList as list, i}
            <tr>
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