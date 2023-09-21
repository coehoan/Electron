<script>
    import {push} from "svelte-spa-router";
    import {onDestroy} from "svelte";

    export let isSettingShow = true;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }

    function fileUpload() {
        window.api.request('fileUpload');
        window.api.response('step1Response', (data) => {
            if (data) {
                push('/step2');
            } else {
                console.log('Error occurred');
            }
        })
    }

    onDestroy(() => {
        window.api.removeResponse('step1Response');
    })
</script>

<div class="modal-overlay" on:click={() => {isSettingShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style="width: 40%; height: 300px; border: 1px solid black; background-color: white" on:click={preventModalClose}>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding: 5px">
            <div>환경설정</div>
            <div style="margin-right: 10px; cursor:pointer; font-size: 20px" on:click={() => {isSettingShow = false}}>X</div>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; height: 260px">
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 80%; padding: 5px">
                <button style="width: 250px;" on:click={fileUpload}>평가데이터 가져오기</button>
                <button style="width: 250px;">백업하기</button>
                <button style="width: 250px;">복원하기</button>
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