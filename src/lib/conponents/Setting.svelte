<script>
    import {push} from "svelte-spa-router";
    import {onDestroy} from "svelte";
    import {DialogType} from "../../../scripts/util/enum";
    import {initData, isFinalListShow} from "../../../scripts/store/store";
    import Loading from "./Loading.svelte";

    export let isSettingShow = true;
    let isLoadingShow = false;

    let dialogOption = {
        option: {
            type: '',
            buttons: [],
            defaultId: 0,
            title: '',
            message: '',
            detail: '',
        }
    }

    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    onDestroy(() => {
        window.api.removeResponse('step1Response');
        window.api.removeResponse('backUpResponse');
        window.api.removeResponse('restoreResponse');
    })

    /**
     * 평가데이터 가져오기
     * */
    function fileUpload() {
        window.api.request('fileUpload');
        window.api.response('step1Response', (data) => {
            if (data === 'canceled') {
                console.log('Canceled');
            } else if (data) {
                $initData.status = 'reimport'
                $initData.questions = data.questions;
                $initData.company = data.company;
                $isFinalListShow = false;
                document.getElementsByTagName('body')[0].style.overflow = 'auto'; // 스크롤 방지 해제
                push('/step2');
            } else {
                console.log('Error occurred');
            }
            window.api.removeResponse('step1Response');
        })
    }

    /**
     * 백업
     * */
    function backUp() {
        window.api.response('openFolderDialogResponse', (data) => {
            if (data.status) {
                isLoadingShow = true;
                window.api.removeResponse('openFolderDialogResponse');
                window.api.request('backUp', data.value);
            }
        })
        window.api.response('backUpResponse', (data) => {
            if (data) {
                dialogOption = {
                    option: {
                        type: DialogType.Info,
                        buttons: [],
                        defaultId: 0,
                        title: '알림',
                        message: '',
                        detail: '백업 완료',
                    }
                }
                window.api.request('dialog', dialogOption);
                window.api.response('dialogCallback', (data) => {
                    // 확인버튼 클릭 시
                    if (data.buttonId === 0) {
                        isLoadingShow = false;
                    }
                })
            }
            window.api.removeResponse('backUpResponse');
        })
        window.api.request('openFolderDialog');
    }

    /**
     * 복원
     * */
    function restore() {
        window.api.response('openFileDialogResponse', (data) => {
            if (data.status) {
                isLoadingShow = true;
                window.api.removeResponse('openFileDialogResponse');
                window.api.request('restore', data.value);
            }
        })
        window.api.request('openFileDialog');
        // window.api.request('restore');
        /*window.api.response('restoreResponse', (data) => {
            if (data === 'canceled') {
                console.log('Canceled.');
            } else if (data) {
                dialogOption = {
                    option: {
                        type: DialogType.Info,
                        buttons: [],
                        defaultId: 0,
                        title: '알림',
                        message: '',
                        detail: '앱이 다시 실행됩니다.',
                    }
                }
                window.api.request('dialog', dialogOption);
            }
            window.api.removeResponse('restoreResponse');
        });*/
    }
</script>

{#if isLoadingShow}
    <div class="loading-overlay">
        <Loading bind:isLoadingShow={isLoadingShow}/>
    </div>
{/if}

<div class="modal-overlay" on:click={() => {isSettingShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style="width: 40%; height: 300px; border: 1px solid black; background-color: white" on:click={preventModalClose}>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding: 5px">
            <div>환경설정</div>
            <div style="margin-right: 10px; cursor:pointer; font-size: 20px" on:click={() => {isSettingShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
                X
            </div>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; height: 260px">
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 80%; padding: 5px">
                <button style="width: 250px;" on:click={fileUpload}>평가데이터 가져오기</button>
                <button style="width: 250px;" on:click={backUp}>백업하기</button>
                <button style="width: 250px;" on:click={restore}>복원하기</button>
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