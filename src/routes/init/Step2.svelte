<script>
    import {onDestroy, onMount} from "svelte";
    import {push} from "svelte-spa-router";
    // 기관 선택 시 안내팝업 한 번 더 노출
    let companyList = [];
    let selectedCompanySeq;

    /* 기관 선택 */
    onMount(() => {
        companyList = [];
        window.api.request('getCompanyList');
    })

    window.api.response('step2CompanyList', (data) => {
        companyList = data
    })
    onDestroy(() => {
        window.api.removeResponse('step2CompanyList');
    })

    function next() {
        if (!!selectedCompanySeq) {
            let selectedCompanyName = companyList.filter(e => e.code === selectedCompanySeq)[0].name;
            let data = {
                option: {
                    type: 'info',
                    buttons: ['OK', 'Cancel'],
                    defaultId: 0,
                    cancelId: 1,
                    title: '알림',
                    message: '',
                    detail: `기관은 변경할 수 없습니다.\n선택하신 '${selectedCompanyName}'(으)로 등록 하시겠습니까?`,
                },
                callbackId: 'step2'
            }
            window.api.request('dialog', data);
            window.api.response('dialogCallback', (data) => {
                // 확인버튼 클릭 시
                if (data.buttonId === 0) {
                    saveCompanyInfo();
                } else window.api.removeResponse('dialogCallback');
            })
        } else {
            let data = {
                option: {
                    type: 'info',
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '기관을 선택해주세요',
                }
            }
            window.api.request('dialog', data);
        }
    }

    function saveCompanyInfo() {
        window.api.request('setBasicInfo', companyList.filter(e => e.code === selectedCompanySeq)[0].id);
        window.api.response('step2Response', (data) => {
            if (data) {
                push('/step3');
            }
        })
    }
</script>

<main>
    <p>기관을 선택해주세요.</p>
    <select bind:value={selectedCompanySeq}>
        {#each companyList as company}
            <option value="{company.code}">{company.name}</option>
        {/each}
    </select>
    <button on:click={next}>다음</button>
</main>

<style>

</style>