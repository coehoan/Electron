<script>
    import Header from "../../lib/layout/Header.svelte";
    import {onDestroy, onMount} from "svelte";
    import {checkInspectScores, checkSelfScores} from "../../../scripts/util/common";
    import InspectModal from "../../lib/conponents/InspectModal.svelte";
    import {companyYear, completeYn} from "../../../scripts/store/store";
    import {DialogType, MainTitle, Yn} from "../../../scripts/util/enum";
    import {push} from "svelte-spa-router";
    import Loading from "../../lib/conponents/Loading.svelte";

    let title = MainTitle.Inspect;
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
    let isListShow = false;
    let isLoadingShow = false;

    let dialogOption = {
        option: {
            type: DialogType.Info,
            buttons: [],
            defaultId: 0,
            title: '알림',
            message: '',
            detail: '제출완료',
        }
    }

    onMount(() => {
        window.api.response('selfResponse', (data) => {
            questionList = data;
            isListShow = checkSelfScores(questionList); // 자체평가 미완료 항목 체크
            if (!isListShow) {
                dialogOption = {
                    option: {
                        type: DialogType.Info,
                        buttons: [],
                        defaultId: 0,
                        title: '알림',
                        message: '',
                        detail: '자체평가가 완료되지 않았습니다.'
                    }
                };
                window.api.request('dialog', dialogOption);

                window.api.response('dialogCallback', data => {
                    // 확인버튼 클릭 시
                    if (data.buttonId === 0) {
                        push('/self'); // 자체평가로 이동
                    }
                    window.api.removeResponse('dialogCallback');
                    window.api.removeResponse('selfResponse');
                });
            }
        })
        window.api.request('getQuestionInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('selfResponse');
        window.api.removeResponse('fileResponse');
    })

    /**
     * 최종 제출
     * */
    function submit() {
        // 미응답 항목 체크
        if (checkInspectScores(questionList)) {
            window.api.response('openFolderDialogResponse', (data) => {
                if (data.status) {
                    isLoadingShow = true;
                    window.api.removeResponse('openFolderDialogResponse');
                    window.api.request('exportInspectFile', {year: $companyYear, path: data.value});
                }
            })
            window.api.response('fileResponse', (data) => {
                if (data) {
                    dialogOption = {
                        option: {
                            type: DialogType.Info,
                            buttons: [],
                            defaultId: 0,
                            title: '알림',
                            message: '',
                            detail: '제출완료',
                        }
                    }
                    window.api.request('dialog', dialogOption);
                    $completeYn = Yn.Y; // 현장실사 완료
                    window.api.response('dialogCallback', (data) => {
                        // 확인버튼 클릭 시
                        if (data.buttonId === 0) {
                            isLoadingShow = false;
                        }
                    })
                }
                window.api.removeResponse('fileResponse');
            })
            window.api.request('openFolderDialog');
        } else {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '답변이 완료되지 않았습니다.',
                }
            }
            window.api.request('dialog', dialogOption);
        }
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
        return list.inspect_result === '' ? 'darkcyan' :
                (list.inspect_result !== '' && list.inspect_result === list.self_result) ? 'white' :
                (list.inspect_result !== '' && list.inspect_result !== list.self_result) ? 'khaki' : '';
    }
</script>

<main>
    {#if isLoadingShow}
        <div class="loading-overlay">
            <Loading bind:isLoadingShow={isLoadingShow}/>
        </div>
    {/if}
    {#if isModalShow}
        <InspectModal bind:isModalShow = {isModalShow} bind:questionList = {questionList} bind:selectedSeq = {selectedSeq}/>
    {/if}
    <Header {title}/>

    {#if isListShow}
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
            {#if $completeYn !== Yn.Y}
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