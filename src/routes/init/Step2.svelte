<script>
    import {onDestroy, onMount} from "svelte";
    import {push} from "svelte-spa-router";
    import {DialogType} from "../../../scripts/util/enum";
    import {initData} from "../../../scripts/store/store";

    let companyList = [];
    let selectedCompanySeq;

    let dialogOption = {
        option: {
            type: DialogType.Info,
            buttons: [],
            defaultId: 0,
            cancelId: 0,
            title: '',
            message: '',
            detail: '',
        }
    }

    /* 기관 선택 */
    onMount(() => {
        companyList = $initData.company;
        companyList.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    })

    onDestroy(() => {
        window.api.removeResponse('dialogCallback');
    })

    function next() {
        if (!!selectedCompanySeq) {
            let selectedCompanyName = companyList.filter(e => e.id === selectedCompanySeq)[0].name; // 선택된 기관명
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: ['OK', 'Cancel'],
                    defaultId: 0,
                    cancelId: 1,
                    title: '알림',
                    message: '',
                    detail: `기관은 변경할 수 없습니다.\n선택하신 '${selectedCompanyName}'(으)로 등록 하시겠습니까?`,
                }
            }
            window.api.request('dialog', dialogOption);
            window.api.response('dialogCallback', (data) => {
                // 확인버튼 클릭 시
                if (data.buttonId === 0) {
                    saveCompanyInfo();
                } else window.api.removeResponse('dialogCallback');
            })
        } else {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '기관을 선택해주세요',
                }
            }
            window.api.request('dialog', dialogOption);
        }
    }

    function saveCompanyInfo() {
        $initData.basic_info = {
            company_seq: selectedCompanySeq
        }
        $initData.company.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
        push('/step3');
    }
</script>

<main>
    <p>기관을 선택해주세요.</p>
    <select bind:value={selectedCompanySeq}>
        {#each companyList as company}
            <option value="{company.id}">{company.name}</option>
        {/each}
    </select>
    <button on:click={next}>다음</button>
</main>

<style>

</style>