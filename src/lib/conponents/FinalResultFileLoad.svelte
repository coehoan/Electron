<script>
    import {onDestroy, onMount} from "svelte";
    import {
        companyCode,
        companyName,
        companySeq,
        companyYear, completeYn,
        isFinalListShow,
    } from "../../../scripts/store/store";
    import {Yn} from "../../../scripts/util/enum";

    export let isFileLoadShow = true;
    export let questionList = [];
    let olderList = [];
    let selectedYear;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    onMount(() => {
        getOlderData();
    })

    onDestroy(() => {
        window.api.removeResponse('getOlderFileListResponse')
        window.api.removeResponse('olderFileDataResponse')
        window.api.removeResponse('selfResponse')
        window.api.removeResponse('mainResponse')
    })

    /**
     * 이전년도 평가결과 리스트 가져오기
     * */
    function getOlderData() {
        let path = '../static/files/result/';
        window.api.request('getOlderFileList', path);
        window.api.response('getOlderFileListResponse', (data) => {
            olderList = !!data ? data : [];
            window.api.removeResponse('getOlderFileListResponse');
        })
    }

    /**
     * 이전년도 평가결과 불러오기
     * */
    function getOlderFile() {
        if (!selectedYear) {
            // 선택된 년도가 없을 때(이전년도 리스트 없음)
            isFileLoadShow = false;
        } else {
            // /static/files/result/ 에 해당년도 폴더가 존재하는지 확인한다.
            let filePath = `../static/files/result/`;
            window.api.request('getOlderFileData', {seq: selectedYear, path: filePath});
            window.api.response('olderFileDataResponse', (data) => {
                // 존재하면 데이터 업데이트
                if (data) {
                    window.api.request('getQuestionInfo');
                    window.api.response('selfResponse', (data) => {
                        questionList = data;
                        window.api.removeResponse('selfResponse');
                    })
                    isFileLoadShow = false; // 팝업창 닫기
                    $isFinalListShow = true; // 결과 리스트 노출
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
                }
            })
        }
        document.getElementsByTagName('body')[0].style.overflow = 'auto'
    }
</script>

<div class="modal-overlay" on:click={() => {isFileLoadShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style=" border: 1px solid black; background-color: white" on:click={preventModalClose}>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding: 5px">
            <div>최종결과 불러오기</div>
            <div style="margin-right: 10px; cursor:pointer; font-size: 20px" on:click={() => {isFileLoadShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>X</div>
        </div>
        <div style="display: flex; justify-content: center; align-items: center">
            <div style="width: 100%; padding: 20px; margin-top: 10px; display: flex; flex-direction:column; justify-content: center; align-items: center">
                {#if olderList.length > 0}
                    <div>* 이전년도 평가결과 불러오기</div>
                    <select bind:value={selectedYear} style="margin-top: 10px; width: 150px;">
                        {#each olderList as list}
                            <option value={list}>{list}</option>
                        {/each}
                    </select>
                {:else}
                    <p>이전 데이터가 존재하지 않습니다.</p>
                {/if}
                <div style="display: flex; justify-content: end; margin-top: 10px">
                    <button style="width: 70px" on:click={getOlderFile}>확인</button>
                    <button style="margin-left: 5px; width: 70px" on:click={() => {isFileLoadShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>취소</button>
                </div>
            </div>
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
        align-items: center;
    }
</style>