<script>

    export let isSettingShow = true;
    let findFile = false;
    export function preventModalClose(event) {
        event.stopPropagation(); // 모달 클릭 이벤트 중지
    }
</script>

<div class="modal-overlay" on:click={() => {isSettingShow = false; document.getElementsByTagName('body')[0].style.overflow = 'auto'}}>
    <div style=" border: 1px solid black; background-color: white" on:click={preventModalClose}>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding: 5px">
            <div>최종결과 불러오기</div>
            <div style="margin-right: 10px; cursor:pointer; font-size: 20px" on:click={() => {isSettingShow = false}}>X</div>
        </div>
        <div style="display: flex; justify-content: center; align-items: center">
            <div style="width: 100%; padding: 20px; margin-top: 10px; display: flex; flex-direction:column; justify-content: center; align-items: center">
                <div>* 이전년도 평가결과 불러오기</div>
                <select style="margin-top: 10px; width: 150px;" disabled={findFile}>
                    <option>2021</option>
                    <option>2022</option>
                    <option>2023</option>
                </select>
                <div style="display: flex; justify-content: end; margin-top: 10px">
                    <button style="width: 70px">확인</button>
                    <button style="margin-left: 5px; width: 70px">취소</button>
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